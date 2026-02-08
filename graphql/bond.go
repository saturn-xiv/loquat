package graphql

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Mutation) IntranetBond(ctx context.Context, args struct {
	Name       string
	Interfaces []string
	Address    string
	Dns        string
	Mode       string
	Enable     bool
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var bond bondProfile
		err := models.GetB(tx, bondKey(args.Name), &bond)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		bond.Interfaces = args.Interfaces
		bond.Address = args.Address
		bond.Enable = args.Enable
		bond.Dns = args.Dns
		bond.Mode = args.Mode
		if err = models.SetB(tx, bondKey(args.Name), &bond); err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("set %s to %v(%s)", args.Name, args.Interfaces, args.Address)}).Error
	}); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}

func (p *Query) IntranetBond(ctx context.Context, args struct{ Name string }) (*IntranetBond, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}

	var bond bondProfile
	err := models.GetB(p.db, bondKey(args.Name), &bond)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	return &IntranetBond{item: &bond}, nil
}
func bondKey(label string) string {
	return fmt.Sprintf("bond.%s", label)
}

type IntranetBond struct {
	item *bondProfile
}

func (p *IntranetBond) Interfaces() []string {
	return p.item.Interfaces
}
func (p *IntranetBond) Address() string {
	return p.item.Address
}

func (p *IntranetBond) Enable() bool {
	return p.item.Enable
}

func (p *IntranetBond) Dns() string {
	return p.item.Dns
}
func (p *IntranetBond) Mode() string {
	return p.item.Mode
}

type bondProfile struct {
	Interfaces []string
	Address    string
	Enable     bool
	Dns        string
	Mode       string
}
