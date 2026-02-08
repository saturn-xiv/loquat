package v2

import (
	"encoding/binary"
	"fmt"
	"net"
)

func uint32_to_ipv4(i uint32) string {
	ip := make(net.IP, 4)
	binary.BigEndian.PutUint32(ip, i)
	return ip.String()
}

func netmask_to_cidr(s string) (int, error) {
	ip := net.ParseIP(s)
	if ip == nil {
		return 0, fmt.Errorf("%s isn't a valid netmask", s)
	}
	ipv4 := ip.To4()
	if ipv4 == nil {
		return 0, fmt.Errorf("%s isn't a valid ipv4 netmask", s)
	}
	mask := net.IPMask(ipv4)
	size, _ := mask.Size()
	return size, nil
}
