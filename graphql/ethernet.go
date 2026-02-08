package graphql

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Mutation) DisableNetworkInterface(ctx context.Context, args struct {
	Name  string
	Label string
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		key := ethernetKey(args.Name)
		var it ethernetProfile
		err := models.GetB(tx, key, &it)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		it.Label = args.Label
		it.Enable = false
		if err := models.SetB(tx, key, &it); err != nil {
			return err
		}
		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("disable %s", args.Name)}).Error
	}); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}
func (p *Mutation) SetNetworkInterfacePublicStaticIp(ctx context.Context, args struct {
	Name     string
	Label    string
	Memo     string
	Address  string
	Netmask  string
	Gateway  string
	Isp      string
	Dns      []string
	Priority int32
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}

	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var profile ethernetProfile
		profile.Label = args.Label
		profile.Memo = args.Memo
		profile.Isp = args.Isp
		profile.Address = args.Address
		profile.Netmask = args.Netmask
		profile.Gateway = args.Gateway
		profile.Dns = args.Dns
		profile.Dhcp = false
		profile.Priority = uint32(args.Priority)
		profile.Enable = true
		if err = models.SetB(tx, ethernetKey(args.Name), &profile); err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("set %s to %s", args.Name, args.Address)}).Error
	}); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}
func (p *Mutation) SetNetworkInterfacePublicDhcp(ctx context.Context, args struct {
	Name     string
	Label    string
	Isp      string
	Memo     string
	Priority int32
}) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	if err := p.db.Transaction(func(tx *gorm.DB) error {
		var profile ethernetProfile
		profile.Label = args.Label
		profile.Memo = args.Memo
		profile.Isp = args.Isp
		profile.Dhcp = true
		profile.Priority = uint32(args.Priority)
		profile.Enable = true
		if err = models.SetB(tx, ethernetKey(args.Name), &profile); err != nil {
			return err
		}

		return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: fmt.Sprintf("set %s to dhcp", args.Name)}).Error
	}); err != nil {
		return nil, err
	}

	return &Ok{}, nil
}

func (p *Query) GetNetworkInterface(ctx context.Context, args struct {
	Name string
}) (*NetworkInterfaceProfile, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	var it ethernetProfile
	err := models.GetB(p.db, ethernetKey(args.Name), &it)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	return &NetworkInterfaceProfile{item: &it}, nil
}
func ethernetKey(name string) string {
	return fmt.Sprintf("net.%s", name)
}

type StaticIp struct {
	label    string
	memo     string
	isp      string
	address  string
	netmask  string
	gateway  string
	dns      []string
	priority int32
	enable   bool
}

func (p *StaticIp) Label() string {
	return p.label
}

func (p *StaticIp) Dns() []string {
	return p.dns
}
func (p *StaticIp) Netmask() string {
	return p.netmask
}
func (p *StaticIp) Gateway() string {
	return p.gateway
}
func (p *StaticIp) Address() string {
	return p.address
}
func (p *StaticIp) Isp() string {
	return p.isp
}
func (p *StaticIp) Priority() int32 {
	return p.priority
}
func (p *StaticIp) Memo() string {
	return p.memo
}
func (p *StaticIp) Enable() bool {
	return p.enable
}

type DynamicIp struct {
	label    string
	memo     string
	isp      string
	priority int32
	enable   bool
}

func (p *DynamicIp) Label() string {
	return p.label
}

func (p *DynamicIp) Isp() string {
	return p.isp
}

func (p *DynamicIp) Memo() string {
	return p.memo
}

func (p *DynamicIp) Priority() int32 {
	return p.priority
}
func (p *DynamicIp) Enable() bool {
	return p.enable
}

type ethernetProfile struct {
	Dhcp     bool
	Address  string
	Netmask  string
	Gateway  string
	Dns      []string
	Isp      string
	Label    string
	Memo     string
	Priority uint32
	Enable   bool
}

type NetworkInterfaceProfile struct {
	item *ethernetProfile
}

func (p *NetworkInterfaceProfile) ToStaticIp() (*StaticIp, bool) {
	if p.item.Dhcp {
		return nil, false
	}
	return &StaticIp{
		isp:      p.item.Isp,
		label:    p.item.Label,
		memo:     p.item.Memo,
		address:  p.item.Address,
		netmask:  p.item.Netmask,
		gateway:  p.item.Gateway,
		dns:      p.item.Dns,
		priority: int32(p.item.Priority),
		enable:   p.item.Enable,
	}, true

}
func (p *NetworkInterfaceProfile) ToDynamicIp() (*DynamicIp, bool) {
	if !p.item.Dhcp {
		return nil, false
	}
	return &DynamicIp{
		isp:      p.item.Isp,
		label:    p.item.Label,
		memo:     p.item.Memo,
		priority: int32(p.item.Priority),
		enable:   p.item.Enable,
	}, true

}
