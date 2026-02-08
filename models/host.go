package models

import (
	"log/slog"
	"net"

	"gorm.io/gorm"

	"github.com/saturn-xiv/palm/loquat/router/nmap"
)

type Host struct {
	gorm.Model

	MemberID *uint
	Name     *string `gorm:"index;size:63"`
	Mac      string  `gorm:"uniqueIndex:idx_hosts_mac_network;index;not null;size:17"`
	Vendor   *string `gorm:"size:63"`
	Network  string  `gorm:"uniqueIndex:idx_hosts_mac_network;index;not null;size:39"`
	Ip       string  `gorm:"index;not null;size:39"`
	Fixed    bool    `gorm:"not null;default:false"`
	Version  uint    `gorm:"not null;default:0"`
	Rules    []Rule  `gorm:"many2many:hosts_rules;"`
	Member   *Member
}

func (Host) TableName() string {
	return "hosts"
}

/*
TODO use masscan

sudo masscan --iflist

--ports 0-65535,U:0-65535
sudo masscan 192.168.6.1/24 --router-ip 192.168.6.1 --ping --output-format JSON --output-filename /tmp/dmz.json --rate 100000
sudo masscan 172.16.0.1/16 --router-ip 172.16.0.1 --ping --output-format JSON --output-filename /tmp/lan.json --rate 100000
*/

func ScanHosts(dev string, network string) ([]Host, error) {
	res, err := nmap.Scan(dev, network)
	if err != nil {
		return nil, err
	}
	slog.Info("scan result", "summary", res.RunStats.Finished.Summary)
	var items []Host
	for _, host := range res.Hosts {
		var it Host
		for _, addr := range host.Addresses {
			if addr.AddrType == "mac" {
				it.Mac = addr.Addr
				it.Vendor = addr.Vendor
				continue
			}
			if addr.AddrType == "ipv4" {
				ip := net.ParseIP(addr.Addr)
				if ip == nil {
					slog.Error("not a valid ip address", "v4", addr.Addr)
				} else {
					_, net, err := net.ParseCIDR(network)
					if err != nil {
						return nil, err
					}
					it.Ip = ip.String()
					it.Network = net.String()
				}
				continue
			}
		}
		if it.Mac == "" || it.Ip == "" || it.Network == "" {
			slog.Warn("found empty host")
			continue
		}
		if len(host.Hostname) > 0 {
			it.Name = &host.Hostname[0]
		}
		{
			name := ""
			if it.Name != nil {
				name = *it.Name
			}

			slog.Debug("found host", "mac", it.Mac, "ip", it.Ip, "vendor", it.Vendor, "name", name)
		}
		items = append(items, it)
	}
	return items, nil
}
