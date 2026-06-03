package controllers

import (
	_ "embed"
	"html/template"
	"io"
	"os"
	"strings"
	"time"

	"github.com/saturn-xiv/loquat/env"
)

//go:embed home.html
var gl_home_html string

func Home(wrt io.Writer) error {
	home, err := os.Hostname()
	if err != nil {
		return nil
	}

	tpl, err := template.New("").Parse(gl_home_html)
	if err != nil {
		return err
	}
	return tpl.Execute(wrt, map[string]interface{}{
		"hostname":    strings.ToUpper(home),
		"now":         time.Now().Format(time.UnixDate),
		"description": env.Description(),
		"version":     env.Version(),
	})
}
