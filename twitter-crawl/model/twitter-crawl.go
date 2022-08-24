package model

import (
	"database/sql"
	"time"
)

type TwitterCrawl struct {
	Id        uint
	UserId    uint
	Username  uint
	Timestamp time.Time
	Text      string

	// ↓ common ↓
	CreatedBy   uint
	UpdatedBy   uint
	PublishedAt sql.NullTime
	CreatedAt   sql.NullTime
	UpdatedAt   sql.NullTime
	DeletedAt   sql.NullTime
}
