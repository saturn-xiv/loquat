package app

import (
	"log"
	"log/slog"

	"github.com/spf13/cobra"

	"github.com/saturn-xiv/palm/loquat/env"
)

var (
	gl_config_file                string
	gl_debug                      bool
	gl_apply_run                  bool
	gl_http_port                  uint16
	gl_set_administrator_username string
	gl_set_administrator_password string

	gl_root_cmd = &cobra.Command{
		Use:     "loquat",
		Short:   env.Description(),
		Version: env.Version(),
	}

	gl_http_cmd = &cobra.Command{
		Use:   "http",
		Short: "Start a HTTP server",
		Run: func(cmd *cobra.Command, args []string) {
			if err := LaunchHttpServer(gl_config_file, gl_http_port, gl_debug); err != nil {
				log.Fatal(err)
			}
		},
	}
	gl_net_scan_cmd = &cobra.Command{
		Use:   "net-scan",
		Short: "Scan network devices",
		Run: func(cmd *cobra.Command, args []string) {
			if err := NetScan(gl_config_file, gl_debug); err != nil {
				log.Fatal(err)
			}
		},
	}
	gl_set_administrator_cmd = &cobra.Command{
		Use:   "set-administrator",
		Short: "Setup an administrator account",
		Run: func(cmd *cobra.Command, args []string) {
			if err := SetAdministrator(gl_config_file, gl_set_administrator_username, gl_set_administrator_password, gl_debug); err != nil {
				log.Fatal(err)
			}
		},
	}

	gl_apply_cmd = &cobra.Command{
		Use:   "apply",
		Short: "Generate an apply script file",
		Run: func(cmd *cobra.Command, args []string) {
			if err := Apply(gl_config_file, gl_apply_run, gl_debug); err != nil {
				log.Fatal(err)
			}
		},
	}
)

func Execute() error {
	return gl_root_cmd.Execute()
}

func init() {
	cobra.OnInitialize(init_logger)

	gl_root_cmd.PersistentFlags().StringVarP(&gl_config_file, "config", "c", "config.toml", "configuration file")
	gl_root_cmd.PersistentFlags().BoolVarP(&gl_debug, "debug", "d", false, "run on debug mode")

	gl_http_cmd.PersistentFlags().Uint16VarP(&gl_http_port, "port", "p", 8080, "listening port")

	gl_set_administrator_cmd.PersistentFlags().StringVarP(&gl_set_administrator_username, "username", "u", "", "username")
	gl_set_administrator_cmd.PersistentFlags().StringVarP(&gl_set_administrator_password, "password", "p", "", "password")

	gl_apply_cmd.PersistentFlags().BoolVarP(&gl_apply_run, "run", "r", false, "run it")

	gl_root_cmd.AddCommand(gl_http_cmd, gl_net_scan_cmd, gl_apply_cmd, gl_set_administrator_cmd)
}

func init_logger() {
	if gl_debug {
		slog.SetLogLoggerLevel(slog.LevelDebug)
	} else {
		slog.SetLogLoggerLevel(slog.LevelInfo)
	}
	slog.Debug("run on debug mode")
}
