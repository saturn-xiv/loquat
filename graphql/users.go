package graphql

import (
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Mutation) SignIn(ctx context.Context, args struct {
	Account struct {
		Name     string
		Password string
	}
	Ttl int32
}) (*SignInResponse, error) {
	ip := client_ip(ctx)
	var user models.User
	if err := p.db.Where(&models.User{Name: args.Account.Name}, "name").Take(&user).Error; err != nil {
		return nil, err
	}
	{
		password := compute_password(args.Account.Password, p.secrets)
		if args.Account.Name != user.Name || password != user.Password {
			return nil, errors.New("invalid account")
		}
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: "Sign in"}).Error
	}); err != nil {
		return nil, err
	}

	now := time.Now()
	claims := &jwt.RegisteredClaims{
		ExpiresAt: &jwt.NumericDate{Time: now.Add(time.Second * time.Duration(args.Ttl))},
		NotBefore: &jwt.NumericDate{Time: now.Add(time.Second * -1)},
		IssuedAt:  &jwt.NumericDate{Time: now},
		Issuer:    "loquat",
		Subject:   user.Name,
	}

	builder := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
	token, err := builder.SignedString(p.secrets)
	if err != nil {
		return nil, err
	}

	return &SignInResponse{name: user.Name, token: token}, nil
}
func (p *Mutation) UpdateProfile(ctx context.Context, args struct {
	Current struct {
		Name     string
		Password string
	}
	New struct {
		Name     string
		Password string
	}
}) (*Ok, error) {
	cur, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	{
		password := compute_password(args.Current.Password, p.secrets)
		if args.Current.Name != cur.Name || password != cur.Password {
			return nil, errors.New("invalid account")
		}
	}
	form := Administrator{Username: args.New.Name, Password: args.New.Password}
	if err = form.Save(p.db, p.secrets, ip); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}

func (p *Mutation) SignOut(ctx context.Context) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	if err = p.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: "Sign out"}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}

type SignInResponse struct {
	token string
	name  string
}

func (p *SignInResponse) Username() string {
	return p.name
}
func (p *SignInResponse) Token() string {
	return p.token
}

type Administrator struct {
	Username string `validate:"required,gte=2,lte=15"`
	Password string `validate:"required,gte=6,lte=31"`
}

func (p *Administrator) Save(db *gorm.DB, key []byte, ip string) error {
	if err := gl_validate.Struct(p); err != nil {
		return err
	}
	password := compute_password(p.Password, key)

	if err := db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		err := tx.Where(&models.User{Name: p.Username}, "name").Take(&user).Error
		if err == nil {
			if err = tx.Model(&user).Updates(map[string]interface{}{
				"password": password,
				"version":  user.Version + 1,
			}).Error; err != nil {
				return err
			}
			if err = tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: "change password"}).Error; err != nil {
				return err
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			user.Name = p.Username
			user.Password = password
			if err = tx.Create(&user).Error; err != nil {
				return err
			}
			if err = tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: "create account"}).Error; err != nil {
				return err
			}
		} else {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

func compute_password(str string, key []byte) string {
	mac := hmac.New(sha512.New, key)
	mac.Write([]byte(str))
	buf := mac.Sum(nil)
	return base64.StdEncoding.WithPadding(base64.NoPadding).EncodeToString(buf)
}
