package router

import "os"

func Id() (string, error) {
	buf, err := os.ReadFile("/sys/class/dmi/id/product_uuid")
	if err != nil {
		return "", err
	}
	return string(buf), nil
}
