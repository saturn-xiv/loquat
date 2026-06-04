package router

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

func Id() (string, error) {
	buf, err := os.ReadFile("/sys/class/dmi/id/product_uuid")
	if err != nil {
		return "", err
	}
	return string(buf), nil
}

func Uptime() (time.Duration, error) {

	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0, err
	}

	fields := strings.Fields(string(data))
	if len(fields) < 1 {
		return 0, fmt.Errorf("unexpected /proc/uptime format")
	}

	uptimeSeconds, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0, err
	}

	return time.Duration(uptimeSeconds) * time.Second, nil
}
