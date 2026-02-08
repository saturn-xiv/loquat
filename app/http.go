package app

import (
	"encoding/base64"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/gorm"

	graphql "github.com/saturn-xiv/palm/loquat/graphql"
	"github.com/saturn-xiv/palm/loquat/models"
)

type HttpServerConfig struct {
	SecretKey  string     `toml:"secret-key"`
	PostgreSql PostgreSql `toml:"postgresql"`
}

func LaunchHttpServer(config_file string, port uint16, debug bool) error {
	slog.Debug("load configuration from", "file", config_file)
	var config HttpServerConfig
	if _, err := toml.DecodeFile(config_file, &config); err != nil {
		return err
	}

	db, err := config.PostgreSql.Open(debug)
	if err != nil {
		return err
	}
	secret_key, err := base64.StdEncoding.DecodeString(config.SecretKey)
	if err != nil {
		return err
	}
	if err := init_db(db); err != nil {
		return err
	}
	graphql_hnd, err := graphql.Handler(db, secret_key)
	if err != nil {
		return err
	}
	router := mux.NewRouter()
	router.Handle("/graphql", graphql_hnd).Methods(http.MethodGet, http.MethodPost)

	router.Use(
		// csrf.Protect(secret_key, csrf.Path("/")),
		handlers.ProxyHeaders,
		handlers.CORS(
			handlers.AllowCredentials(),
			handlers.AllowedMethods([]string{http.MethodGet, http.MethodPost}),
			handlers.AllowedHeaders([]string{graphql.ContentType, graphql.Authorization})),
	)

	addr := fmt.Sprintf("127.0.0.1:%d", port)
	slog.Info("HTTP server listening at", "address", addr)
	server := &http.Server{
		Handler:      handlers.CombinedLoggingHandler(os.Stdout, router),
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	return server.ListenAndServe()

}

func init_db(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		{
			var c int64
			if err := tx.Model(&models.Member{}).Count(&c).Error; err != nil {
				return err
			}
			if c == 0 {
				if err := tx.Create(&models.Member{
					Sn:   "anonymous",
					Name: "Anonymous",
				}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
