package models

import "time"

type Log struct {
	ID        uint
	UserID    uint   `gorm:"not null"`
	Ip        string `gorm:"index;not null;size:39"`
	User      User
	Message   string `gorm:"not null;type:text"`
	CreatedAt time.Time
}

func (Log) TableName() string {
	return "logs"
}
