package app

import (
	"log/slog"

	"github.com/BurntSushi/toml"

	"github.com/saturn-xiv/palm/loquat/graphql"
)

type ApplyConfig struct {
	PostgreSql PostgreSql `toml:"postgresql"`
}

func Apply(config_file string, run bool, debug bool) error {
	slog.Debug("load configuration from", "file", config_file)
	var config NetScanConfig

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
	if err = rt.Apply(run); err != nil {
		return err
	}

	if run {
		if err := graphql.SetLastRunAt(db); err != nil {
			return err
		}
	}

	slog.Info("done.")
	return nil
}
