package models

import "gorm.io/gorm"

type Member struct {
	gorm.Model

	Sn           string `gorm:"uniqueIndex;not null;size:15"`
	Name         string `gorm:"index;not null;size:31"`
	WifiPassword string `gorm:"not null;size:255"`
	Memo         string `gorm:"not null;type:text"`
	Version      uint   `gorm:"not null;default:0"`
	Hosts        []Host
	Rules        []Rule `gorm:"many2many:members_rules;"`
}

func (Member) TableName() string {
	return "members"
}
