package v2

import (
	"fmt"
	"io"
	"net"
)

var (
	DMZ = "bond-dmz"
	LAN = "bond-lan"
)

func (p *IntranetBond) firewalld(wrt io.Writer, zone string, device string) error {
	if _, err := fmt.Fprintf(wrt, "firewall-cmd --permanent --zone=%s --change-interface=%s\n", zone, device); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(wrt, "firewall-cmd --permanent --zone=%s --add-service=http --add-service=dhcp --add-service=dns\n", zone); err != nil {
		return err
	}
	// if _, err := fmt.Fprintf(wrt, "firewall-cmd --add-service=imap --zone=%s --timeout=5m\n", zone); err != nil {
	// 	return err
	// }

	return nil
}

func (p *IntranetBond_Mode) ToString() string {
	switch *p {
	case IntranetBond_BALANCE_ALB:
		return "balance-alb"
	case IntranetBond_BALANCE_XOR:
		return "balance-xor"
	default:
		return ""
	}
}

// https://netplan.readthedocs.io/en/stable/examples/#how-to-configure-multiple-bonds
// https://netplan.readthedocs.io/en/latest/netplan-yaml/#properties-for-device-type-bonds
// https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/7/html/networking_guide/overview-of-bonding-modes-and-the-required-settings-on-the-switch

func (p *IntranetBond) netplan(dev string) (string, error) {
	{
		ip4, _, err := net.ParseCIDR(p.Network.Address)
		if err != nil {
			return "", err
		}
		if !ip4.IsPrivate() {
			return "", fmt.Errorf("%s isn't a private address", ip4.String())
		}
	}

	items := map[string]interface{}{
		"interfaces": p.Interfaces,
		"addresses":  []string{p.Network.Address},
		"parameters": map[string]interface{}{
			"mode":                 p.Mode.ToString(),
			"mii-monitor-interval": p.MiiMonitorInterval,
			// layer2, layer3+4, layer2+3, encap2+3 and encap3+4.
			"transmit-hash-policy": "layer3+4",
		},
	}

	return render_netplan_yaml("bonds", dev, items)
}

func intranet_ethernet_netplan(dev string) (string, error) {
	return render_netplan_yaml("ethernets", dev, map[string]interface{}{
		"dhcp4":     false,
		"dhcp6":     false,
		"addresses": []string{},
	})
}
