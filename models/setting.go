package models

import (
	"bytes"
	"encoding/gob"
	"errors"

	"google.golang.org/protobuf/proto"
	"gorm.io/gorm"
)

type Setting struct {
	gorm.Model

	Key     string `gorm:"uniqueIndex;not null;size:255"`
	Value   []byte `gorm:"not null;type:bytes"`
	Version uint   `gorm:"not null;default:0"`
}

func (Setting) TableName() string {
	return "settings"
}

func Set(db *gorm.DB, key string, val []byte) error {
	var it Setting
	err := db.Where(map[string]interface{}{"key": key}).Take(&it).Error
	if err == nil {
		return db.Model(&it).Updates(map[string]interface{}{
			"value":   val,
			"version": it.Version + 1,
		}).Error

	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		it.Key = key
		it.Value = val
		return db.Create(&it).Error
	}
	return err
}

func Get(db *gorm.DB, key string) ([]byte, error) {
	var it Setting
	if err := db.Where(map[string]interface{}{"key": key}).Take(&it).Error; err != nil {
		return nil, err
	}
	return it.Value, nil
}

func SetProtobuf(db *gorm.DB, key string, val proto.Message) error {
	buf, err := proto.Marshal(val)
	if err != nil {
		return err
	}
	return Set(db, key, buf)
}

func GetProtobuf(db *gorm.DB, key string, val proto.Message) error {
	buf, err := Get(db, key)
	if err != nil {
		return err
	}
	return proto.Unmarshal(buf, val)
}

func SetB(db *gorm.DB, key string, val interface{}) error {
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	if err := enc.Encode(val); err != nil {
		return err
	}
	return Set(db, key, buf.Bytes())
}

func GetB(db *gorm.DB, key string, val interface{}) error {
	tmp, err := Get(db, key)
	if err != nil {
		return err
	}
	buf := bytes.NewBuffer(tmp)
	dec := gob.NewDecoder(buf)
	return dec.Decode(val)
}
