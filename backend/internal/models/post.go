package models

import (
	"time"
)

// Post 社区帖子（短文本为主，支持图片/视频）
type Post struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"user_id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	MediaType     *string   `json:"media_type,omitempty"` // "image" | "video" | null
	MediaURL      *string   `json:"media_url,omitempty"`
	LikesCount    int       `json:"likes_count"`
	CommentsCount int       `json:"comments_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	// 关联作者（列表/详情返回）
	AuthorName string `json:"author_name"`
	AuthorAvatar string `json:"author_avatar,omitempty"`
}
