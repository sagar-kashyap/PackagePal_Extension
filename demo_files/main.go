package main

import (
    "fmt"
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/jinzhu/gorm"
)

func main() {
    r := gin.Default()
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "pong",
        })
    })
    r.Run()
}
