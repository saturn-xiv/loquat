package graphql

import (
	"context"

	graphql "github.com/graph-gophers/graphql-go"

	"github.com/saturn-xiv/palm/loquat/models"
)

func (p *Query) IndexLog(ctx context.Context, args struct {
	Page struct {
		Index int32
		Size  int32
	}
}) (*IndexLogResponse, error) {
	if _, _, err := current_user(ctx, p.db, p.secrets); err != nil {
		return nil, err
	}
	var total int64
	if err := p.db.Model(&models.Log{}).Count(&total).Error; err != nil {
		return nil, err
	}
	pagination := NewPagination(&Page{Index: uint(args.Page.Index), Size: uint(args.Page.Size)}, uint(total))
	var items []models.Log
	if err := p.db.Order("created_at DESC").
		Offset(int(pagination.current.Offset())).
		Limit(int(pagination.current.Size)).
		Preload("User").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return &IndexLogResponse{items: items, pagination: pagination}, nil

}

type User struct {
	item *models.User
}

func (p *User) Id() graphql.ID {
	return ToId(p.item.ID)
}

func (p *User) Name() string {
	return p.item.Name
}

type Log struct {
	item *models.Log
}

func (p *Log) User() *User {
	return &User{item: &p.item.User}
}

func (p *Log) Id() graphql.ID {
	return ToId(p.item.ID)
}

func (p *Log) Message() string {
	return p.item.Message
}
func (p *Log) Ip() string {
	return p.item.Ip
}
func (p *Log) CreatedAt() graphql.Time {
	return graphql.Time{Time: p.item.CreatedAt}
}

type IndexLogResponse struct {
	items      []models.Log
	pagination *Pagination
}

func (p *IndexLogResponse) Pagination() *Pagination {
	return p.pagination
}

func (p *IndexLogResponse) Items() ([]*Log, error) {
	var items []*Log
	for _, it := range p.items {
		items = append(items, &Log{item: &it})
	}
	return items, nil
}
