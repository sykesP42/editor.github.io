-- 创建数据库
CREATE DATABASE IF NOT EXISTS markdown_editor;
USE markdown_editor;

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_username` (`username`),
  UNIQUE KEY `uniq_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例用户（密码：password123）
INSERT INTO `users` (`username`, `email`, `password_hash`) VALUES
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1t6iRTb3jXG6z5Y2VvJzQeO3p5wJY5u'),
('testuser', 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1t6iRTb3jXG6z5Y2VvJzQeO3p5wJY5u');

-- 文档表（数据库上传记录）
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_title` (`title`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 社区帖子表（短文本为主，支持图片/视频）
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `media_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'image|video|null',
  `media_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `likes_count` int NOT NULL DEFAULT '0',
  `comments_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子示例数据
INSERT INTO `posts` (`user_id`, `title`, `content`, `media_type`, `media_url`, `likes_count`, `comments_count`) VALUES
(1, 'Markdown 高级技巧分享', '分享一些提高写作效率的 Markdown 技巧，包括自定义样式和扩展语法，欢迎交流。', 'image', 'https://picsum.photos/600/400?random=1', 42, 8),
(1, '我的第一个 Vue 项目心得', '记录从零开始搭建 Vue 项目的整个过程和遇到的问题，希望对新手有帮助。', NULL, NULL, 28, 5),
(2, '如何设计优雅的代码高亮', '探讨不同编程语言的代码高亮方案和颜色搭配技巧，附示例。', 'image', 'https://picsum.photos/600/400?random=2', 56, 12),
(2, '轻量编辑器使用小技巧', '社区版编辑器的一些快捷操作和主题切换，让创作更高效。', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 19, 3),
(1, '今日灵感记录', '把突然想到的创意记下来，用短帖的形式分享给同好。', NULL, NULL, 7, 1);

SET FOREIGN_KEY_CHECKS = 1;