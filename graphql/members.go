package graphql

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	graphql "github.com/graph-gophers/graphql-go"
	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Mutation) CreateMember(ctx context.Context, args struct {
	Id   graphql.ID
	Sn   string
	Name string
	Memo string
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	sn := strings.ToLower(strings.TrimSpace(args.Sn))
	{
		form := MemberCreateForm{Sn: sn, Name: args.Name, Memo: args.Memo}
		if err = gl_validate.Struct(&form); err != nil {
			return nil, err
		}
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var member models.Member
		err := tx.Unscoped().Where(map[string]interface{}{"sn": sn}).Take(&member).Error
		if err == nil {
			return fmt.Errorf("member %s is exists", sn)
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		member.Name = args.Name
		{
			buf := make([]byte, 32)
			if _, err = rand.Read(buf); err != nil {
				return err
			}
			member.WifiPassword = base64.URLEncoding.EncodeToString(buf)
		}
		member.Memo = args.Memo
		member.Sn = sn
		if err = tx.Create(&member).Error; err != nil {
			return err
		}
		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("create member %s", member.Sn)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) UpdateMember(ctx context.Context, args struct {
	Id   graphql.ID
	Name string
	Memo string
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	{
		form := MemberUpdateForm{Name: args.Name, Memo: args.Memo}
		if err = gl_validate.Struct(&form); err != nil {
			return nil, err
		}
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var member models.Member
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&member).Error; err != nil {
			return err
		}
		if err = tx.Model(&member).Updates(map[string]interface{}{
			"name":    args.Name,
			"memo":    args.Memo,
			"version": member.Version + 1,
		}).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("update member %s profile", member.Sn)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) SetMemberWifiPassword(ctx context.Context, args struct {
	Id       graphql.ID
	Password string
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	{
		form := MemberWifiPasswordForm{Password: args.Password}
		if err = gl_validate.Struct(&form); err != nil {
			return nil, err
		}
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var member models.Member
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&member).Error; err != nil {
			return err
		}
		if err = tx.Model(&member).Updates(map[string]interface{}{
			"wifi_password": args.Password,
			"version":       member.Version + 1,
		}).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("reset wifi-password for member %s", member.Sn)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) EnableMember(ctx context.Context, args struct {
	Id graphql.ID
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var member models.Member
		if err := tx.Unscoped().Where(map[string]interface{}{"id": id}).Take(&member).Error; err != nil {
			return err
		}
		if err = tx.Unscoped().Model(&member).Updates(map[string]interface{}{
			"deleted_at": nil,
			"version":    member.Version + 1,
		}).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("enable member %s", member.Sn)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) DisableMember(ctx context.Context, args struct {
	Id graphql.ID
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var member models.Member
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&member).Error; err != nil {
			return err
		}
		if err = tx.Delete(&member).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("disable member %s", member.Sn)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Query) IndexMember(ctx context.Context) ([]*Member, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	var members []models.Member
	if err := p.db.Unscoped().Order("updated_at DESC").Find(&members).Error; err != nil {
		return nil, err
	}
	var items []*Member
	for _, member := range members {
		items = append(items, &Member{item: &member})
	}
	return items, nil
}
func (p *Query) ShowMember(ctx context.Context, args struct{ Id graphql.ID }) (*Member, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	var member models.Member
	if err = p.db.Where(map[string]interface{}{"id": id}).Take(&member).Error; err != nil {
		return nil, err
	}
	return &Member{item: &member}, nil
}

type Member struct {
	item *models.Member
}

func (p *Member) Id() graphql.ID {
	return ToId(p.item.ID)
}

func (p *Member) UpdatedAt() graphql.Time {
	return graphql.Time{Time: p.item.UpdatedAt}
}

func (p *Member) DeletedAt() *graphql.Time {
	if p.item.DeletedAt.Valid {
		return &graphql.Time{Time: p.item.DeletedAt.Time}
	}
	return nil
}
func (p *Member) Name() string {
	return p.item.Name
}

func (p *Member) Sn() string {
	return p.item.Sn
}

func (p *Member) Memo() string {
	return p.item.Memo
}

type MemberWifiPasswordForm struct {
	Password string `validate:"required,gte=8,lte=31"`
}
type MemberCreateForm struct {
	Sn   string `validate:"alphanum,required,gte=2,lte=31"`
	Name string `validate:"required,gte=2,lte=63"`
	Memo string `validate:"required,gte=1,lte=2047"`
}
type MemberUpdateForm struct {
	Name string `validate:"required,gte=2,lte=63"`
	Memo string `validate:"required,gte=1,lte=2047"`
}
