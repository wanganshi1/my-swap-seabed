package model

import (
	"time"
)

type TwitterCrawl struct {
	CommonEntity

	ID        uint      `gorm:"column:id;primaryKey;autoIncrement:true" json:"id"`
	TweetID   string    `gorm:"column:tweet_id;type:varchar(256);not null;unique" json:"tweet_id"`
	UserID    string    `gorm:"column:user_id;type:varchar(256);not null" json:"user_id"`
	Username  string    `gorm:"column:username;type:varchar(256);not null" json:"username"`
	TweetTime time.Time `gorm:"column:tweet_time;precision:6" json:"tweet_time"`
	Content   string    `gorm:"column:content;type:text;not null" json:"content"`
}

func (TwitterCrawl) TableName() string {
	return "twitter_crawl"
}
