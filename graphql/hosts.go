package graphql

import (
	"context"
	"fmt"
	"net"
	"strings"

	graphql "github.com/graph-gophers/graphql-go"
	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Mutation) AssociateHostWithMember(ctx context.Context, args struct {
	Host   graphql.ID
	Member graphql.ID
}) (*Ok, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	hid, err := FromId(args.Host)
	if err != nil {
		return nil, err
	}
	mid, err := FromId(args.Member)
	if err != nil {
		return nil, err
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var host models.Host
		if err := tx.Where(map[string]interface{}{"id": hid}).Take(&host).Error; err != nil {
			return err
		}
		var member models.Member
		if err := tx.Where(map[string]interface{}{"id": mid}).Take(&member).Error; err != nil {
			return err
		}
		if err = tx.Model(&host).Updates(map[string]interface{}{
			"member_id": member.ID,
			"version":   host.Version + 1,
		}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}

func (p *Mutation) SetHostName(ctx context.Context, args struct {
	Id   graphql.ID
	Name string
}) (*Ok, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(args.Name)
	{
		form := Hostname{Value: name}
		if err := gl_validate.Struct(form); err != nil {
			return nil, err
		}
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var host models.Host
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
			return err
		}
		if err = tx.Model(&host).Updates(map[string]interface{}{
			"name":    name,
			"version": host.Version + 1,
		}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}
func (p *Mutation) ReleaseHost(ctx context.Context, args struct{ Id graphql.ID }) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	var host models.Host
	if err := p.db.Unscoped().Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
		return nil, err
	}
	if !host.DeletedAt.Valid {
		return &Ok{}, nil
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		if err = tx.Unscoped().Model(&host).Updates(map[string]interface{}{
			"deleted_at": nil,
			"version":    host.Version + 1,
		}).Error; err != nil {
			return err
		}
		if err = tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("release host %s@%s", host.Mac, host.Network)}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) BlockHost(ctx context.Context, args struct{ Id graphql.ID }) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	var host models.Host
	if err := p.db.Unscoped().Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
		return nil, err
	}
	if host.DeletedAt.Valid {
		return &Ok{}, nil
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&host).Error; err != nil {
			return err
		}
		if err = tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("block host %s@%s", host.Mac, host.Network)}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}
func (p *Mutation) SetHostStaticIp(ctx context.Context, args struct {
	Id   graphql.ID
	Name string
	Ip   string
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(args.Name)
	{
		it := Hostname{Value: name}
		if err := gl_validate.Struct(&it); err != nil {
			return nil, err
		}
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var host models.Host
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
			return err
		}

		{
			_, net4, err := net.ParseCIDR(host.Network)
			if err != nil {
				return err
			}
			ip := net.ParseIP(args.Ip)
			if ip == nil {
				return fmt.Errorf("%s is not a valid ip address", args.Ip)
			}
			if !net4.Contains(ip) {
				return fmt.Errorf("%s is not a valid ip address", args.Ip)
			}
		}
		{
			var items []models.Host
			if err := tx.Where(map[string]interface{}{"ip": args.Ip}).Take(&items).Error; err == nil {
				for _, it := range items {
					if it.ID != host.ID {
						return fmt.Errorf("ip %s is in used", args.Ip)
					}
				}
			}
		}
		if err = tx.Model(&host).Updates(map[string]interface{}{
			"name":    name,
			"ip":      args.Ip,
			"fixed":   true,
			"version": host.Version + 1,
		}).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("bind %s to %s", host.Mac, args.Ip)}).Error

	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}

func (p *Mutation) SetHostDynamicIp(ctx context.Context, args struct{ Id graphql.ID }) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var host models.Host
		if err := tx.Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
			return err
		}
		if err = tx.Model(&host).Updates(map[string]interface{}{
			"fixed":   false,
			"version": host.Version + 1,
		}).Error; err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("set %s to using dynamic ip", host.Mac)}).Error
	}); err != nil {
		return nil, err
	}
	return &Ok{}, nil
}

func (p *Query) IndexHost(ctx context.Context) ([]*Host, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	var hosts []models.Host
	if err := p.db.Unscoped().Order("updated_at DESC").Find(&hosts).Error; err != nil {
		return nil, err
	}
	var items []*Host
	for _, host := range hosts {
		it, err := NewHost(p.db, &host)
		if err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, nil
}
func (p *Query) ShowHost(ctx context.Context, args struct{ Id graphql.ID }) (*Host, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	id, err := FromId(args.Id)
	if err != nil {
		return nil, err
	}
	var host models.Host
	if err = p.db.Unscoped().Where(map[string]interface{}{"id": id}).Take(&host).Error; err != nil {
		return nil, err
	}
	return NewHost(p.db, &host)
}

type Host struct {
	item   *models.Host
	member *Member
}

func NewHost(db *gorm.DB, host *models.Host) (*Host, error) {
	res := Host{
		item: host,
	}
	if host.MemberID != nil {
		var member models.Member
		if err := db.Where(map[string]interface{}{"id": *host.MemberID}).Take(&member).Error; err != nil {
			return nil, err
		}
		res.member = &Member{item: &member}
	}
	return &res, nil
}

func (p *Host) Id() graphql.ID {
	return ToId(p.item.ID)
}
func (p *Host) Name() *string {
	return p.item.Name
}

func (p *Host) Mac() string {
	return p.item.Mac
}

func (p *Host) Ip() string {
	return p.item.Ip
}

func (p *Host) Vendor() *string {
	return p.item.Vendor
}

func (p *Host) Network() string {
	return p.item.Network
}

func (p *Host) Fixed() bool {
	return p.item.Fixed
}

func (p *Host) UpdatedAt() graphql.Time {
	return graphql.Time{Time: p.item.UpdatedAt}
}

func (p *Host) DeletedAt() *graphql.Time {
	if !p.item.DeletedAt.Valid {
		return nil
	}
	return &graphql.Time{Time: p.item.DeletedAt.Time}
}
func (p *Host) Member() *Member {
	return p.member
}

type Hostname struct {
	Value string `validate:"alphanum,required,gte=2,lte=31"`
}
