package router

import "os/exec"

func Trace(device string, host string) (string, error) {
	buf, err := exec.Command("traceroute", "-i", device, "-4", host).Output()
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
