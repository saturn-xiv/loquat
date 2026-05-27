package app

import (
	"bytes"
	_ "embed"
	"errors"
	html_template "html/template"
	"log/slog"
	"maps"
	"os"
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
		} else if err != nil {
			return err
		} else if !maps.Equal(status.Items, last.Items) {
			if err := models.SetB(db, key, &status); err != nil {
				return err
			}
			apply = true
		}
	}
	if !apply {
		return nil
	}
	subject, body, err := build__heartbeat_email(status, rt)
	if err != nil {
		return err
	}
	for device := range rt.Wan {
		if !status.Items[device] {
			delete(rt.Wan, device)
		}
	}
	if err = rt.Apply(run); err != nil {
		return err
	}

	if run {
		if err := graphql.SetLastRunAt(db); err != nil {
			return err
		}
	}

	if err := config.Smtp.Send(config.Administrators, subject, body, true); err != nil {
		return err
	}

	slog.Info("done.")
	return nil
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

func build__heartbeat_email(status *EthernetHeartbeatStatus, router *router_v2.Router) (string, string, error) {
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
