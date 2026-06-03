package v2

import (
	_ "embed"
	"io"
	"log/slog"
	"text/template"
)

//go:embed templates/emcp.txt
var gl_emcp_txt string

func Ecmp(wrt io.Writer, wan map[string]*Internet) error {
	if wan == nil {
		return nil
	}
	slog.Debug("setup EMCP rules")

	data := make(map[string]interface{})
	for name, eth := range wan {
		ip, err := Ipv4(name)
		if err != nil {
			slog.Error("couldn't get address for", "device", name, "reason", err.Error())
			continue
		}
		data[name] = map[string]interface{}{
			"weight": eth.Weight,
			"ip":     ip,
		}
	}

	tpl, err := template.New("").Parse(gl_emcp_txt)
	if err != nil {
		return err
	}
	return tpl.Execute(wrt, data)
}
