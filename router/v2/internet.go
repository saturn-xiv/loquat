package v2

import (
	"fmt"
)

// https://netplan.readthedocs.io/en/stable/examples/#
// https://netplan.readthedocs.io/en/latest/netplan-yaml/#properties-for-device-type-ethernets
func (p *Internet) netplan(dev string) (string, error) {
	args := make(map[string]interface{})
	switch p.Ip.(type) {
	case *Internet_Dhcp:
		args["dhcp4"] = true
		args["dhcp4-overrides"] = map[string]interface{}{"route-metric": p.metric()}
		args["dhcp6"] = false
	case *Internet_Static_:
		cidr, err := netmask_to_cidr(p.GetStatic().Netmask)
		if err != nil {
			return "", err
		}
		args["addresses"] = []string{fmt.Sprintf("%s/%d", p.GetStatic().Address, cidr)}
		args["nameservers"] = map[string]interface{}{
			"addresses": p.GetStatic().Dns,
		}
		args["routes"] = []map[string]interface{}{
			{
				"to":     "default",
				"via":    p.GetStatic().Gateway,
				"metric": p.metric(),
			},
		}
	default:
		// https://netplan.readthedocs.io/en/latest/netplan-yaml/#properties-for-device-type-modems
		return "", fmt.Errorf("does not support mod %v yet", p.Ip)
	}
	return render_netplan_yaml("ethernets", dev, args)
}

func (p *Internet) metric() uint32 {
	return p.Priority + 100
}
