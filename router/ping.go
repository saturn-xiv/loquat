package router

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os/exec"
	"syscall"
	"time"
)

func Ping(device string, host string) (string, error) {
	slog.Debug("ping", "device", device, "host", host)
	buf, err := exec.Command("ping", "-I", device, "-c", "3", "-W", "2", "-4", host).Output()
	if err != nil {
		return "", err
	}
	return string(buf), nil
}

func Ncsi(device string) error {
	return HttpHeartbeat(device, "http://www.msftconnecttest.com/connecttest.txt")
}

func HttpHeartbeat(device string, url string) error {
	slog.Debug("http get", "device", device, "url", url)
	dialer := &net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 30 * time.Second,
		Control: func(network, address string, c syscall.RawConn) error {
			var innerErr error
			err := c.Control(func(fd uintptr) {
				// Use SO_BINDTODEVICE to anchor the socket descriptor to the device name
				innerErr = syscall.SetsockoptString(int(fd), syscall.SOL_SOCKET, syscall.SO_BINDTODEVICE, device)
			})
			if err != nil {
				return err
			}
			return innerErr
		},
	}

	client := &http.Client{
		Transport: &http.Transport{
			DialContext: dialer.DialContext,
		},
	}

	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%d %s", resp.StatusCode, string(body))
	}
	slog.Debug("response", "body", string(body))
	return nil
}

func LookupHost(ctx context.Context, server string, host string) ([]string, error) {
	r := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{}
			return d.DialContext(ctx, "udp", fmt.Sprintf("%s:53", server))
		},
	}
	return r.LookupHost(context.Background(), host)
}
