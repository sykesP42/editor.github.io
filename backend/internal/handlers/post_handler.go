package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"markdown-editor-backend/internal/models"
	"markdown-editor-backend/pkg/api"
)

type PostHandler struct {
	db *sql.DB
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{db: db}
}

// ListPosts 帖子列表（公开，分页，按时间倒序）
func (h *PostHandler) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	rows, err := h.db.Query(`
		SELECT p.id, p.user_id, p.title, p.content, p.media_type, p.media_url, p.likes_count, p.comments_count, p.created_at,
		       COALESCE(u.username, '匿名') AS author_name
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		api.Error(c, http.StatusInternalServerError, "获取帖子列表失败")
		return
	}
	defer rows.Close()

	var list []models.Post
	for rows.Next() {
		var p models.Post
		var mediaType, mediaURL sql.NullString
		if err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &mediaType, &mediaURL,
			&p.LikesCount, &p.CommentsCount, &p.CreatedAt, &p.AuthorName); err != nil {
			continue
		}
		if mediaType.Valid {
			p.MediaType = &mediaType.String
		}
		if mediaURL.Valid {
			p.MediaURL = &mediaURL.String
		}
		p.AuthorAvatar = "https://ui-avatars.com/api/?name=" + p.AuthorName + "&background=random"
		list = append(list, p)
	}

	// 总数（简单实现）
	var total int
	_ = h.db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&total)

	api.Success(c, gin.H{
		"list":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetPost 帖子详情（公开）
func (h *PostHandler) GetPost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		api.Error(c, http.StatusBadRequest, "无效的帖子 ID")
		return
	}

	var p models.Post
	var mediaType, mediaURL sql.NullString
	err = h.db.QueryRow(`
		SELECT p.id, p.user_id, p.title, p.content, p.media_type, p.media_url, p.likes_count, p.comments_count, p.created_at, p.updated_at,
		       COALESCE(u.username, '匿名') AS author_name
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`, id).Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &mediaType, &mediaURL,
		&p.LikesCount, &p.CommentsCount, &p.CreatedAt, &p.UpdatedAt, &p.AuthorName)

	if err == sql.ErrNoRows {
		api.Error(c, http.StatusNotFound, "帖子不存在")
		return
	}
	if err != nil {
		api.Error(c, http.StatusInternalServerError, "获取帖子失败")
		return
	}
	if mediaType.Valid {
		p.MediaType = &mediaType.String
	}
	if mediaURL.Valid {
		p.MediaURL = &mediaURL.String
	}
	p.AuthorAvatar = "https://ui-avatars.com/api/?name=" + p.AuthorName + "&background=random"

	api.Success(c, p)
}

// LikePost 点赞（需登录，即时反馈）
func (h *PostHandler) LikePost(c *gin.Context) {
	_, ok := h.getUserID(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		api.Error(c, http.StatusBadRequest, "无效的帖子 ID")
		return
	}

	res, err := h.db.Exec("UPDATE posts SET likes_count = likes_count + 1, updated_at = ? WHERE id = ?", time.Now(), id)
	if err != nil {
		api.Error(c, http.StatusInternalServerError, "点赞失败")
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		api.Error(c, http.StatusNotFound, "帖子不存在")
		return
	}

	var newCount int
	_ = h.db.QueryRow("SELECT likes_count FROM posts WHERE id = ?", id).Scan(&newCount)
	api.Success(c, gin.H{"likes_count": newCount})
}

func (h *PostHandler) getUserID(c *gin.Context) (int64, bool) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		api.Error(c, http.StatusUnauthorized, "请先登录")
		return 0, false
	}
	userID, ok := userIDVal.(int64)
	if !ok {
		api.Error(c, http.StatusInternalServerError, "无效的用户 ID 类型")
		return 0, false
	}
	return userID, true
}
