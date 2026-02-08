package app

import (
	"errors"
	"log/slog"

	"github.com/BurntSushi/toml"
	"github.com/saturn-xiv/palm/loquat/graphql"
	"github.com/saturn-xiv/palm/loquat/models"
	v2 "github.com/saturn-xiv/palm/loquat/router/v2"
	"gorm.io/gorm"
)

type NetScanConfig struct {
	PostgreSql PostgreSql `toml:"postgresql"`
}

func NetScan(config_file string, debug bool) error {
	slog.Debug("load configuration from", "file", config_file)
	var config NetScanConfig

	if _, err := toml.DecodeFile(config_file, &config); err != nil {
		return err
	}

	db, err := config.PostgreSql.Open(debug)
	if err != nil {
		return err
	}

	if err = nmap_scan(db); err != nil {
		return err
	}
	return nil
}

func nmap_scan(db *gorm.DB) error {
	router, err := graphql.Export(db)
	if err != nil {
		return err
	}

	var hosts []models.Host
	if router.Dmz != nil {
		items, err := models.ScanHosts(v2.DMZ, router.Dmz.Network.Address)
		if err != nil {
			return err
		}
		hosts = append(hosts, items...)
	}
	if router.Lan != nil {
		items, err := models.ScanHosts(v2.LAN, router.Lan.Network.Address)
		if err != nil {
			return err
		}
		hosts = append(hosts, items...)
	}

	inserted := 0
	updated := 0
	if err = db.Transaction(func(tx *gorm.DB) error {
		for _, host := range hosts {
			var it models.Host
			err := db.Where(map[string]interface{}{"mac": host.Mac, "network": host.Network}).Take(&it).Error
			if err == nil {
				if err = db.Model(&it).Updates(map[string]interface{}{
					"ip":      host.Ip,
					"vendor":  host.Vendor,
					"version": it.Version + 1,
				}).Error; err != nil {
					return err
				}
				updated += 1
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				if err = db.Create(&host).Error; err != nil {
					return err
				}
				inserted += 1
			} else {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}
	slog.Info("succeed", "inserted", inserted, "updated", updated)
	return nil
}
