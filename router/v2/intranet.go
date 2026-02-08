package v2

import (
	_ "embed"
	"encoding/binary"
	"errors"
	"io"
	"log/slog"
	"net"
	"text/template"
)

//go:embed templates/dnsmasq.txt
var gl_dnsmasq_txt string

//go:embed templates/dnsmasq-header.txt
var gl_dnsmasq_header_txt string

func (p *Intranet) DnsServers() []string {
	switch p.Dns.(type) {
	case *Intranet_Ali_:
		// https://www.alidns.com/
		return []string{"223.5.5.5", "223.6.6.6"}
	case *Intranet_Google_:
		// https://developers.google.com/speed/public-dns
		return []string{"8.8.8.8", "8.8.4.4"}
	case *Intranet_Other_:
		return p.GetOther().Addresses
	default:
		return []string{}
	}
}

func (p *Intranet) Gateway() (string, error) {
	first, _, err := p.ipv4_addresses()
	if err != nil {
		return "", err
	}
	return uint32_to_ipv4(first + 1), nil
}

func (p *Intranet) Broadcast() (string, error) {
	_, last, err := p.ipv4_addresses()
	if err != nil {
		return "", err
	}
	return uint32_to_ipv4(last), nil
}

func (p *Intranet) Network() (string, error) {
	_, net4, err := net.ParseCIDR(p.Address)
	if err != nil {
		return "", err
	}
	return net4.String(), nil
}

func (p *Intranet) Addresses() ([]string, error) {
	first, last, err := p.ipv4_addresses()
	if err != nil {
		return nil, err
	}
	var items []string
	for i := first + 2; i < last; i += 1 {
		items = append(items, uint32_to_ipv4(i))
	}
	return items, nil
}

func (p *Intranet) ipv4_addresses() (uint32, uint32, error) {
	_, net4, err := net.ParseCIDR(p.Address)
	if err != nil {
		return 0, 0, err
	}
	mask := binary.BigEndian.Uint32(net4.Mask)
	first := binary.BigEndian.Uint32(net4.IP)
	last := (first & mask) | (mask ^ 0xffffffff)
	return first, last, nil
}

func (p *Intranet) dnsmasq(wrt io.Writer, dev string) error {
	slog.Debug("setup dnsmasq for", "device", dev)

	var hosts []map[string]interface{}
	for _, it := range p.Hosts {
		hosts = append(hosts, map[string]interface{}{
			"mac":  it.Mac,
			"ip":   it.Ip,
			"name": it.Name,
		})
	}
	gateway, err := p.Gateway()
	if err != nil {
		return err
	}
	network, err := p.Network()
	if err != nil {
		return err
	}
	addresses, err := p.Addresses()
	if err != nil {
		return err
	}
	if len(addresses) < 4 {
		return errors.New("no enough address range")
	}
	tpl, err := template.New("").Parse(gl_dnsmasq_txt)
	if err != nil {
		return err
	}

	return tpl.Execute(wrt, map[string]interface{}{
		"device":  dev,
		"network": network,
		"gateway": gateway,
		"dns":     p.DnsServers(),
		"hosts":   hosts,
		"begin":   addresses[0],
		"end":     addresses[len(addresses)-1],
	})
}
