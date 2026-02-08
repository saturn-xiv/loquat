package graphql

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"syscall"

	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
	"github.com/saturn-xiv/palm/loquat/router"
)

func (p *Mutation) Apply(ctx context.Context, args struct{ Run bool }) (*Ok, error) {
	user, ip, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}
	item, err := Export(p.db)
	if err != nil {
		return nil, err
	}
	if err = item.Apply(args.Run); err != nil {
		return nil, err
	}

	if args.Run {
		if err := p.db.Transaction(func(tx *gorm.DB) error {
			if err := SetLastRunAt(tx); err != nil {
				return err
			}
			return tx.Create(&models.Log{UserID: user.ID, Ip: ip, Message: "Sign in"}).Error
		}); err != nil {
			return nil, err
		}
	}

	return &Ok{}, nil
}

func (p *Mutation) Reboot(ctx context.Context) (*Ok, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	go func() {
		if err := syscall.Reboot(syscall.LINUX_REBOOT_CMD_RESTART); err != nil {
			slog.Error(err.Error())
		}
	}()
	return &Ok{}, nil
}

func (p *Query) IndexNetworkInterface(ctx context.Context) ([]*NetworkInterface, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}
	var items []*NetworkInterface
	for _, iface := range ifaces {
		if iface.Name == "lo" {
			continue
		}
		it, err := NewNetworkInterface(p.db, &iface)
		if err != nil {
			slog.Error("failed to detect interface", "name", iface.Name)
			continue
		}
		items = append(items, it)
	}

	return items, nil
}
func (p *Query) ShowNetworkInterface(ctx context.Context, args struct{ Name string }) (*NetworkInterface, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	iface, err := net.InterfaceByName(args.Name)
	if err != nil {
		return nil, err
	}
	return NewNetworkInterface(p.db, iface)
}

func (p *Query) Status(ctx context.Context) (*router.SystemStatus, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	return &router.SystemStatus{}, nil
}

type NetworkInterface struct {
	item  *net.Interface
	label string
	memo  string
}

func NewNetworkInterface(db *gorm.DB, iface *net.Interface) (*NetworkInterface, error) {
	var profile ethernetProfile
	err := models.GetB(db, ethernetKey(iface.Name), &profile)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &NetworkInterface{item: iface, label: profile.Label, memo: profile.Memo}, nil

}

func (p *NetworkInterface) Name() string {
	return p.item.Name
}

func (p *NetworkInterface) Memo() string {
	return p.memo
}

func (p *NetworkInterface) Label() string {
	return p.label
}

func (p *NetworkInterface) Mtu() int32 {
	return int32(p.item.MTU)
}
func (p *NetworkInterface) HardwareAddress() string {
	return p.item.HardwareAddr.String()
}
func (p *NetworkInterface) Addresses() ([]string, error) {
	addrs, err := p.item.Addrs()
	if err != nil {
		return nil, err
	}
	var items []string
	for _, addr := range addrs {
		items = append(items, addr.String())
	}
	return items, nil
}

func (p *NetworkInterface) MulticastAddresses() ([]string, error) {
	addrs, err := p.item.MulticastAddrs()
	if err != nil {
		return nil, err
	}
	var items []string
	for _, addr := range addrs {
		items = append(items, addr.String())
	}
	return items, nil
}
