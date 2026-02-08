package app

import (
	"encoding/base64"
	"log/slog"

	"github.com/BurntSushi/toml"

	"github.com/saturn-xiv/palm/loquat/graphql"
)

type SetAdministratorConfig struct {
	SecretKey  string     `toml:"secret-key"`
	PostgreSql PostgreSql `toml:"postgresql"`
}

func SetAdministrator(config_file string, username string, password string, debug bool) error {
	slog.Debug("load configuration from", "file", config_file)
	var config SetAdministratorConfig

	if _, err := toml.DecodeFile(config_file, &config); err != nil {
		return err
	}
	key, err := base64.StdEncoding.DecodeString(config.SecretKey)
	if err != nil {
		return err
	}
	db, err := config.PostgreSql.Open(debug)
	if err != nil {
		return err
	}
	form := graphql.Administrator{Username: username, Password: password}
	if err = form.Save(db, key, "127.0.0.1"); err != nil {
		return err
	}
	slog.Info("done.")
	return nil
}
