package mail

import (
	"log/slog"

	"github.com/wneessen/go-mail"
)

type Config struct {
	Host     string `toml:"host"`
	Port     uint16 `toml:"port"`
	User     string `toml:"user"`
	Password string `toml:"password"`
}

func (p *Config) Send(to []string, subject string, body string, html bool) error {
	slog.Info("send email", "to", to, "subject", subject)

	message := mail.NewMsg()
	if err := message.From(p.User); err != nil {
		return err
	}
	if err := message.To(to...); err != nil {
		return err
	}
	message.Subject(subject)
	if html {
		message.SetBodyString(mail.TypeTextHTML, body)
	} else {
		message.SetBodyString(mail.TypeTextPlain, body)
	}

	client, err := mail.NewClient(p.Host, mail.WithSSLPort(true), mail.WithSMTPAuth(mail.SMTPAuthPlain), mail.WithUsername(p.User), mail.WithPassword(p.Password))
	if err != nil {
		return err
	}

	return client.DialAndSend(message)
}
