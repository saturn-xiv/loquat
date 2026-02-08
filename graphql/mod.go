package graphql

import (
	"context"
	_ "embed"
	"encoding/gob"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/env"
	"github.com/saturn-xiv/palm/loquat/models"
	v2 "github.com/saturn-xiv/palm/loquat/router/v2"
)

var (
	ContentType   = "Content-Type"
	Authorization = "Authorization"
	Bearer        = "Bearer "
	XForwardedFor = "X-Forwarded-For"
	XRealIp       = "X-Real-IP"
)

var gl_validate = validator.New(validator.WithRequiredStructEnabled())

//go:embed schema.gql
var gl_schema_txt string

type headerKey string

func Handler(db *gorm.DB, secret_key []byte) (http.HandlerFunc, error) {
	schema, err := graphql.ParseSchema(gl_schema_txt, &Root{
		db:      db,
		secrets: secret_key,
	})
	if err != nil {
		return nil, err
	}
	handler := &relay.Handler{Schema: schema}
	return http.HandlerFunc(func(wrt http.ResponseWriter, req *http.Request) {
		ctx := req.Context()
		{
			auth := req.Header.Get(Authorization)
			if strings.HasPrefix(auth, Bearer) {
				token := strings.TrimPrefix(auth, Bearer)
				ctx = context.WithValue(ctx, headerKey(Authorization), token)
			}
		}
		ctx = context.WithValue(ctx, headerKey(XForwardedFor), req.Header.Get(XForwardedFor))
		ctx = context.WithValue(ctx, headerKey(XRealIp), req.Header.Get(XRealIp))
		// slog.Debug("header", XForwardedFor, req.Header.Get(XForwardedFor), XRealIp, req.Header.Get(XRealIp))
		handler.ServeHTTP(wrt, req.WithContext(ctx))
	}), nil
}

type Mutation struct {
	db      *gorm.DB
	secrets []byte
}

type Query struct {
	db      *gorm.DB
	secrets []byte
}

func (p *Query) Version() string {
	return env.Version()
}

func (p *Query) Addresses(ctx context.Context, args struct{ Ip string }) ([]string, error) {
	it := v2.Intranet{Address: args.Ip}
	return it.Addresses()
}

type Root struct {
	db      *gorm.DB
	secrets []byte
}

func (p *Root) Query() *Query {
	return &Query{db: p.db, secrets: p.secrets}
}

func (p *Root) Mutation() *Mutation {
	return &Mutation{db: p.db, secrets: p.secrets}
}

type Page struct {
	Index uint
	Size  uint
}

func (p *Page) Offset() uint {
	return (p.Index - 1) * p.Size
}

type Pagination struct {
	current     *Page
	pages       uint
	total       uint
	hasPrevious bool
	hasNext     bool
}

func (p *Pagination) Size() int32 {
	return int32(p.current.Size)
}

func (p *Pagination) Index() int32 {
	return int32(p.current.Index)
}
func (p *Pagination) Pages() int32 {
	return int32(p.pages)
}
func (p *Pagination) Total() int32 {
	return int32(p.total)
}

func (p *Pagination) HasNext() bool {
	return p.hasNext
}

func (p *Pagination) HasPrevious() bool {
	return p.hasPrevious
}

func NewPagination(page *Page, total uint) *Pagination {
	size := page.Size
	if size < 20 {
		size = 20
	}
	if size > 1000 {
		size = 1000
	}
	index := page.Index
	if index < 1 {
		index = 1
	}
	pages := total / size
	if total%size > 0 {
		pages = pages + 1
	}
	if index*size > total {
		index = pages
	}
	return &Pagination{
		current:     &Page{Index: index, Size: size},
		total:       total,
		pages:       pages,
		hasPrevious: index > 1,
		hasNext:     index < pages,
	}
}

type Ok struct {
}

func (p *Ok) CreatedAt() graphql.Time {
	return graphql.Time{Time: time.Now()}
}

func ToId(id uint) graphql.ID {
	return graphql.ID(strconv.FormatUint(uint64(id), 36))
}
func FromId(id graphql.ID) (uint, error) {
	it, err := strconv.ParseUint(string(id), 36, 32)
	if err != nil {
		return 0, err
	}
	return uint(it), nil
}

func client_ip(ctx context.Context) string {
	it, ok := ctx.Value(headerKey(XRealIp)).(string)
	if ok {
		return it
	}
	return "n/a"
}

func current_user(ctx context.Context, db *gorm.DB, jwt_key []byte) (*models.User, string, error) {
	client_ip := client_ip(ctx)
	auth, ok := ctx.Value(headerKey(Authorization)).(string)
	if !ok {
		return nil, "", errors.New("no token")
	}
	token, err := jwt.Parse(auth, func(token *jwt.Token) (any, error) {
		return jwt_key, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS512.Alg()}))
	if err != nil {
		return nil, "", err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, "", errors.New("invalid token")
	}
	sub, err := claims.GetSubject()
	if err != nil {
		return nil, "", err
	}
	var user models.User
	if err = db.Where(&models.User{Name: sub}, "name").Take(&user).Error; err != nil {
		return nil, "", err
	}
	return &user, client_ip, nil
}

func init() {
	gob.Register(ethernetProfile{})
	gob.Register(bondProfile{})
}
