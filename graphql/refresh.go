package graphql

import (
	"os"
	"strings"
	"time"

	graphql "github.com/graph-gophers/graphql-go"
	"gorm.io/gorm"

	"github.com/saturn-xiv/loquat/env"
	"github.com/saturn-xiv/loquat/models"
)

var (
	gl_last_run_at = "last.run-at"
)

func SetLastRunAt(db *gorm.DB) error {
	now := time.Now()
	return models.SetB(db, gl_last_run_at, now)
}

func (p *Query) Refresh() *RefreshResponse {
	var res RefreshResponse
	{
		var last_run_at time.Time
		if err := models.GetB(p.db, gl_last_run_at, &last_run_at); err == nil {
			res.last_run_at = &last_run_at
		}
	}
	return &res
}

type RefreshResponse struct {
	last_run_at *time.Time
}

func (p *RefreshResponse) Version() string {
	return env.Version()
}
func (p *RefreshResponse) Description() string {
	return env.Description()
}

func (p *RefreshResponse) Hostname() (string, error) {
	it, err := os.Hostname()
	if err != nil {
		return "", nil
	}
	return strings.ToUpper(it), nil
}
func (p *RefreshResponse) CreatedAt() graphql.Time {
	return graphql.Time{Time: time.Now()}
}

func (p *RefreshResponse) LastRunAt() *graphql.Time {
	if p.last_run_at == nil {
		return nil
	}
	return &graphql.Time{Time: *p.last_run_at}
}
