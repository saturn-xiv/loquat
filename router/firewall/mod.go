package firewall

import (
	"bytes"
	"fmt"
	"os/exec"
)

func Status(zone string) (string, error) {
	return exec_command("firewall-cmd", fmt.Sprintf("--zone=%s", zone), "--list-all")
}

func Zones() (string, error) {
	return exec_command("firewall-cmd", "--get-zones")
}

func exec_command(cmd string, args ...string) (string, error) {
	var buf bytes.Buffer
	it := exec.Command(cmd, args...)
	it.Stdout = &buf
	if err := it.Run(); err != nil {
		return "", err
	}
	return buf.String(), nil
}
