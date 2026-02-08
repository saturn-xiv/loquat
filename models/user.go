package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	Name     string `gorm:"uniqueIndex;not null;size:31"`
	Password string `gorm:"not null;size:255"`
	Version  uint   `gorm:"not null;default:0"`
	Logs     []Log
}

func (User) TableName() string {
	return "users"
}
