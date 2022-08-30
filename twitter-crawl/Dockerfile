FROM golang:latest

WORKDIR /app
COPY . .
RUN go mod tidy && go build . && chmod +x twitter-crawl