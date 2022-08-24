package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	twitterscraper "github.com/n0madic/twitter-scraper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func connectDB() (db *gorm.DB) {
	DB_HOST := os.Getenv("DB_HOST")
	DB_NAME := os.Getenv("DB_NAME")
	DB_PORT := os.Getenv("DB_PORT")
	DB_USER := os.Getenv("DB_USER")
	DB_PASS := os.Getenv("DB_PASS")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME)
	fmt.Println("dsn:", dsn)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err.Error())
	}

	return db
}

func main() {
	err := godotenv.Load(fmt.Sprintf("..%c.env", os.PathSeparator))
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db := connectDB()
	db.Config.Name()

	scraper := twitterscraper.New()

	for tweet := range scraper.SearchTweets(context.Background(), "@zksync", 50) {
		if tweet.Error != nil {
			panic(tweet.Error)
		}

		fmt.Println("=============================")
		fmt.Println(tweet.Timestamp)
		fmt.Println(tweet.Text)
		fmt.Println(tweet.UserID)
		fmt.Println(tweet.Username)
	}

	time.Sleep(time.Second * 3)

	// for tweet := range scraper.GetTweets(context.Background(), "Twitter", 50) {
	// 	if tweet.Error != nil {
	// 		panic(tweet.Error)
	// 	}
	// 	fmt.Println(tweet.Text)
	// }
}
