package v2

import (
	_ "embed"
	"io"
	"log/slog"
	"text/template"

	"github.com/goccy/go-yaml"
)

//go:embed templates/netplan.txt
var gl_netplan_txt string

func (p *Router) setup_netplan(wrt io.Writer) error {
	slog.Debug("setup netplan")
	items := make(map[string]interface{})
	if p.Wan != nil {
		for name, eth := range p.Wan {
			buf, err := eth.netplan(name)
			if err != nil {
				return err
			}
			items[name] = netplan_profile(100, name, buf)
		}
	}
	if p.Dmz != nil {
		buf, err := p.Dmz.netplan(DMZ)
		if err != nil {
			return err
		}
		items[DMZ] = netplan_profile(200, DMZ, buf)
		for _, it := range p.Dmz.Interfaces {
			buf, err := intranet_ethernet_netplan(it)
			if err != nil {
				return err
			}
			items[it] = netplan_profile(100, it, buf)
		}
	}
	if p.Lan != nil {
		buf, err := p.Lan.netplan(LAN)
		if err != nil {
			return err
		}
		items[LAN] = netplan_profile(200, LAN, buf)
		for _, it := range p.Lan.Interfaces {
			buf, err := intranet_ethernet_netplan(it)
			if err != nil {
				return err
			}
			items[it] = netplan_profile(100, it, buf)
		}
	}

	tpl, err := template.New("").Parse(gl_netplan_txt)
	if err != nil {
		return err
	}
	return tpl.Execute(wrt, map[string]interface{}{"items": items})
}

func netplan_profile(order int, label string, content string) map[string]interface{} {
	return map[string]interface{}{"order": order, "label": label, "content": content}
}

func render_netplan_yaml(category string, dev string, args map[string]interface{}) (string, error) {
	buf, err := yaml.Marshal(map[string]interface{}{
		"network": map[string]interface{}{
			"version":  2,
			"renderer": "networkd",
			category:   map[string]interface{}{dev: args},
		},
	})
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
