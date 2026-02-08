package graphql

import (
	"context"
	"errors"
	"net"

	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/models"
	v2 "github.com/saturn-xiv/palm/loquat/router/v2"
)

func (p *Query) Interfaces(ctx context.Context) (*InterfacesResponse, error) {
	_, _, err := current_user(ctx, p.db, p.secrets)
	if err != nil {
		return nil, err
	}

	return &InterfacesResponse{p.db}, nil
}

type InterfacesResponse struct {
	db *gorm.DB
}

func (p *InterfacesResponse) Dmz() (*IntranetBond, error) {
	item, err := load_bond(p.db, v2.DMZ)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, nil
	}
	return &IntranetBond{item}, nil
}
func (p *InterfacesResponse) Lan() (*IntranetBond, error) {
	item, err := load_bond(p.db, v2.LAN)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, nil
	}
	return &IntranetBond{item}, nil
}
func (p *InterfacesResponse) Ethernets() ([]*EthernetInterface, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var items []*EthernetInterface
	for _, iface := range ifaces {
		if !v2.IsEthernet(iface.Name) {
			continue
		}
		it := EthernetInterface{iface: &iface}

		var profile ethernetProfile
		err := models.GetB(p.db, ethernetKey(iface.Name), &profile)
		if err == nil {
			it.profile = &profile
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		items = append(items, &it)
	}
	return items, nil
}

type EthernetInterface struct {
	iface   *net.Interface
	profile *ethernetProfile
}

func (p *EthernetInterface) Name() string {
	return p.iface.Name
}

func (p *EthernetInterface) Profile() *NetworkInterfaceProfile {
	if p.profile == nil {
		return nil
	}
	return &NetworkInterfaceProfile{p.profile}
}
