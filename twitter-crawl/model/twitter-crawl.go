package model

import (
	"database/sql"
	"time"
)

type TwitterCrawl struct {
	Id        uint
	TweetId   string
	UserId    string
	Username  string
	Timestamp time.Time
	Text      string

	// ↓ common ↓
	CreatedBy   uint
	UpdatedBy   uint
	PublishedAt sql.NullTime
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   sql.NullTime
}

func (TwitterCrawl) TableName() string {
	return "twitter_crawl"
}
