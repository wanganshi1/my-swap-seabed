package model

import (
	"database/sql"
	"time"
)

type TwitterCrawl struct {
	Id        uint
	TweetId   uint
	UserId    uint
	Username  uint
	Timestamp time.Time
	Text      string

	// ↓ common ↓
	CreatedBy   uint
	UpdatedBy   uint
	PublishedAt sql.NullTime
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   time.Time
}
