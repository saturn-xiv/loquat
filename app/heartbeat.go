package app

import (
	"bytes"
	_ "embed"
	"errors"
	"fmt"
	html_template "html/template"
	"log/slog"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	text_template "text/template"
	"time"

	"github.com/BurntSushi/toml"
	"gorm.io/gorm"

	"github.com/saturn-xiv/loquat/graphql"
	"github.com/saturn-xiv/loquat/mail"
	"github.com/saturn-xiv/loquat/models"
	"github.com/saturn-xiv/loquat/router"
	router_v2 "github.com/saturn-xiv/loquat/router/v2"
	v2 "github.com/saturn-xiv/loquat/router/v2"
)

type HeartbeatConfig struct {
	Administrators []string    `toml:"administrators"`
	PostgreSql     PostgreSql  `toml:"postgresql"`
	Smtp           mail.Config `toml:"smtp"`
}

func Heartbeat(config_file string, host string, run bool, debug bool) error {
	if len(host) == 0 {
		return errors.New("empty target host")
	}
	slog.Debug("load configuration from", "file", config_file)
	var config HeartbeatConfig

	if _, err := toml.DecodeFile(config_file, &config); err != nil {
		return err
	}

	db, err := config.PostgreSql.Open(debug)
	if err != nil {
		return err
	}

	rt, err := graphql.Export(db)
	if err != nil {
		return err
	}
	if rt.Wan == nil {
		return nil
	}
	var apply = false

	status := NewEthernetHeartbeatStatus(host, slices.Collect(maps.Keys(rt.Wan))...)
	{
		key := "ethernet.heartbeats"

		var last EthernetHeartbeatStatus
		err := models.GetB(db, key, &last)
		if e := models.SetB(db, key, &status); e != nil {
			return e
		}
		if err == gorm.ErrRecordNotFound {
			apply = true
		} else if err != nil {
			return err
		} else if !maps.Equal(status.Items, last.Items) {
			apply = true
		}
	}

	if len(rt.Wan) == 0 {
		slog.Error("no wan networks")
		return nil
	}
	slog.Info("active ethernet", "interfaces", slices.Sorted(maps.Keys(rt.Wan)))

	if !apply {
		slog.Info("nothing to do")
		return nil
	}
	subject, body, err := build_heartbeat_email(status, rt)
	if err != nil {
		return err
	}
	for name, ok := range status.Items {
		if !ok {
			delete(rt.Wan, name)
		}
	}
	{
		tmp := filepath.Join(os.TempDir(), fmt.Sprintf("route-%s.sh", time.Now().Format("20060102150405")))
		if err := render_ecmp_file(tmp, rt.Wan); err != nil {
			return err
		}

		if run {
			slog.Warn("try to apply script", "name", tmp)
			cmd := exec.Command("bash", tmp)
			if err := cmd.Run(); err != nil {
				return err
			}
		}
	}

	if err := config.Smtp.Send(config.Administrators, subject, body, true); err != nil {
		return err
	}

	slog.Info("done.")
	return nil
}

func render_ecmp_file(name string, wan map[string]*v2.Internet) error {
	slog.Info("generate shell script", "file", name)
	file, err := os.Create(name)
	if err != nil {
		return err
	}
	defer file.Close()
	return v2.Ecmp(file, wan)
}

type EthernetHeartbeatStatus struct {
	Items     map[string]bool
	CreatedAt time.Time
}

func (p *EthernetHeartbeatStatus) Ok() bool {
	for _, v := range p.Items {
		if !v {
			return false
		}
	}
	return true
}

func NewEthernetHeartbeatStatus(host string, devices ...string) *EthernetHeartbeatStatus {
	var res = EthernetHeartbeatStatus{
		Items:     make(map[string]bool),
		CreatedAt: time.Now(),
	}
	for _, device := range devices {
		_, err := router.Ping(device, host)
		if err != nil {
			slog.Error(err.Error())
		}
		res.Items[device] = err == nil
	}
	return &res
}

//go:embed heartbeat-report/subject.txt.tpl
var gl_heartbeat_report_subject string

//go:embed heartbeat-report/body.html.tpl
var gl_heartbeat_report_body string

func build_heartbeat_email(status *EthernetHeartbeatStatus, router *router_v2.Router) (string, string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return "", "", err
	}
	tpl_s, err := text_template.New("").Parse(gl_heartbeat_report_subject)
	if err != nil {
		return "", "", err
	}
	var subject bytes.Buffer
	if err := tpl_s.Execute(&subject, map[string]interface{}{"hostname": hostname, "ok": status.Ok(), "created_at": status.CreatedAt}); err != nil {
		return "", "", err
	}

	tpl_b, err := html_template.New("").Parse(gl_heartbeat_report_body)
	if err != nil {
		return "", "", err
	}
	var body bytes.Buffer
	{
		items := make(map[string]interface{})
		for dev, cfg := range router.Wan {
			items[dev] = map[string]interface{}{
				"device": dev,
				"ok":     status.Items[dev],
				"label":  cfg.Label,
				"memo":   cfg.Memo,
			}
		}
		if err := tpl_b.Execute(&body, map[string]interface{}{"created_at": status.CreatedAt, "items": items}); err != nil {
			return "", "", err
		}
	}

	return strings.TrimSpace(subject.String()), strings.TrimSpace(body.String()), nil
}
