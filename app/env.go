package app

import (
	"fmt"
	"log/slog"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/saturn-xiv/palm/loquat/models"
)

type PostgreSql struct {
	Host     string `toml:"host"`
	Port     uint16 `toml:"port"`
	DbName   string `toml:"db-name"`
	User     string `toml:"user"`
	Password string `toml:"password"`
}

func (p *PostgreSql) Open(debug bool) (*gorm.DB, error) {
	config := gorm.Config{}
	if debug {
		config.Logger = logger.Default.LogMode(logger.Info)
	} else {
		config.Logger = logger.Default.LogMode(logger.Warn)
	}

	slog.Info("open postgresql", "host", p.Host, "port", p.Port, "db-name", p.DbName, "user", p.User)
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d sslmode=disable TimeZone=UTC", p.User, p.Password, p.DbName, p.Host, p.Port),
		PreferSimpleProtocol: true,
	}), &config)
	if err != nil {
		return nil, err
	}
	if err = db.AutoMigrate(&models.Setting{}, &models.User{}, &models.Log{}, &models.Host{}, &models.Member{}, &models.Rule{}); err != nil {
		return nil, err
	}
	return db, nil
}
