package router

import (
	"log/slog"
	"os/exec"
)

func Ping(device string, host string) (string, error) {
	slog.Debug("ping", "device", device, "host", host)
	buf, err := exec.Command("ping", "-I", device, "-c", "3", "-W", "2", "-4", host).Output()
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
