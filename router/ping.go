package router

import "os/exec"

func Ping(device string, host string) (string, error) {
	buf, err := exec.Command("ping", "-I", device, "-c", "10", "-W", "2", "-4", host).Output()
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
