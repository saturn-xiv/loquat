package graphql

import (
	"errors"
	"log/slog"
	"net"

	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/env"
	"github.com/saturn-xiv/palm/loquat/models"
	v2 "github.com/saturn-xiv/palm/loquat/router/v2"
)

func Export(db *gorm.DB) (*v2.Router, error) {
	var rt v2.Router
	{
		slog.Debug("load wan profiles")
		it, err := load_wan(db)
		if err != nil {
			return nil, err
		}
		rt.Wan = it
	}
	{
		slog.Debug("load dmz profile")
		bond, err := load_intranet_bond(db, v2.DMZ)
		if err != nil {
			return nil, err
		}
		rt.Dmz = bond
	}
	{
		slog.Debug("load lan profile")
		bond, err := load_intranet_bond(db, v2.LAN)
		if err != nil {
			return nil, err
		}
		rt.Lan = bond
	}

	{
		slog.Debug("verify network interfaces")
		if err := rt.VerifyInterface(); err != nil {
			return nil, err
		}
	}

	rt.CreatedAt = timestamppb.Now()
	rt.Version = env.Version()
	return &rt, nil
}

func load_wan(db *gorm.DB) (map[string]*v2.Internet, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	wan := make(map[string]*v2.Internet)
	for _, iface := range ifaces {
		if !v2.IsEthernet(iface.Name) {
			continue
		}
		var profile ethernetProfile
		if err := models.GetB(db, ethernetKey(iface.Name), &profile); err != nil {
			continue
		}
		if !profile.Enable {
			continue
		}
		it := v2.Internet{
			Label:    profile.Label,
			Isp:      profile.Isp,
			Priority: profile.Priority + 100,
			Memo:     profile.Memo,
		}
		if profile.Dhcp {
			it.Ip = &v2.Internet_Dhcp{Dhcp: &emptypb.Empty{}}
		} else {
			it.Ip = &v2.Internet_Static_{
				Static: &v2.Internet_Static{
					Address: profile.Address,
					Netmask: profile.Netmask,
					Gateway: profile.Gateway,
					Dns:     profile.Dns,
				},
			}
		}
		wan[iface.Name] = &it
	}
	return wan, nil
}

func load_bond(db *gorm.DB, name string) (*bondProfile, error) {
	var it bondProfile
	err := models.GetB(db, bondKey(name), &it)
	if err == nil {
		return &it, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return nil, err
}

func load_intranet_bond(db *gorm.DB, name string) (*v2.IntranetBond, error) {
	bond, err := load_bond(db, name)
	if err != nil {
		return nil, err
	}
	if bond == nil || !bond.Enable {
		return nil, nil
	}
	res := v2.IntranetBond{
		Interfaces:         bond.Interfaces,
		MiiMonitorInterval: 100,
		Network: &v2.Intranet{
			Address: bond.Address,
		},
	}
	switch bond.Dns {
	case "Google":
		res.Network.Dns = &v2.Intranet_Google_{Google: &v2.Intranet_Google{}}
	default:
		res.Network.Dns = &v2.Intranet_Ali_{Ali: &v2.Intranet_Ali{}}
	}
	switch bond.Mode {
	case "BalanceAlb":
		res.Mode = v2.IntranetBond_BALANCE_ALB
	default:
		res.Mode = v2.IntranetBond_BALANCE_XOR
	}

	{
		_, net4, err := net.ParseCIDR(bond.Address)
		if err != nil {
			return nil, err
		}
		var hosts []models.Host
		if err = db.Where(map[string]interface{}{"network": net4.String(), "fixed": true}).Find(&hosts).Error; err != nil {
			return nil, err
		}
		for _, host := range hosts {
			if host.Name == nil {
				slog.Warn("ignore empty hostname", "mac", host.Mac, "ip", host.Ip)
				continue
			}
			res.Network.Hosts = append(res.Network.Hosts, &v2.Intranet_Host{
				Mac:  host.Mac,
				Ip:   host.Ip,
				Name: *host.Name,
			})
		}
	}
	return &res, nil
}
