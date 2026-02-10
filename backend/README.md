# Markdown 编辑器后端

Go + Gin 后端，提供认证与文档 API，MySQL 存储用户与文档。

## 目录结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 程序入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置加载（环境变量 / .env）
│   ├── database/
│   │   └── mysql.go             # MySQL 连接与建库建表
│   ├── handlers/
│   │   ├── auth_handler.go      # 注册/登录/个人资料
│   │   ├── document_handler.go  # 文档 CRUD、搜索、统计
│   │   └── user_handler.go      # 用户相关
│   ├── middleware/
│   │   ├── cors.go              # CORS
│   │   ├── jwt.go               # JWT 鉴权
│   │   └── logger.go            # 日志
│   ├── models/
│   │   ├── document.go          # 文档模型
│   │   └── user.go              # 用户模型
│   ├── server/
│   │   └── server.go            # 路由与服务启动
│   └── utils/
│       ├── jwt.go               # JWT 工具
│       └── password.go          # 密码工具
├── pkg/
│   └── api/
│       └── response.go          # 统一响应格式
├── databaseinit/
│   └── init.sql                 # 建库建表（users、documents）
├── scripts/
│   ├── run.bat                  # Windows 启动脚本
│   ├── init-db.bat              # 初始化数据库脚本
│   ├── test-db.bat              # 测试数据库连接
│   └── genhash.go               # 生成 bcrypt 哈希（脚本）
├── .env                         # 环境变量（需自建）
├── go.mod
├── go.sum
└── README.md
```

## 环境变量

在项目根目录（backend）下新建 `.env`，例如：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=markdown_editor
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24
SERVER_PORT=8080
GIN_MODE=debug
```

## 运行

```bash
go mod tidy
go run ./cmd/server/main.go
```

或使用脚本（Windows）：

```bash
scripts\run.bat
```

默认地址：**http://localhost:8080**

## 默认账号

首次建库或执行 `databaseinit/init.sql` 后可用：

- 用户名：`admin` 或 `testuser`
- 密码：`123456`

（注：示例用户密码哈希对应 `password123`，若需 `123456` 可用 `scripts/genhash.go` 生成新哈希后更新 init.sql。）

## 数据库设计

### 数据库与表

- 数据库：`markdown_editor`
- 表：`users`、`documents`

### users 表

```sql
CREATE DATABASE IF NOT EXISTS markdown_editor;
USE markdown_editor;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_username` (`username`),
  UNIQUE KEY `uniq_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### documents 表

```sql
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `file_size` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_title` (`title`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

完整建表语句见 **databaseinit/init.sql**。

## API 说明

### 认证（无需 Token）

- `POST /api/auth/register` — 注册（body: username, email, password）
- `POST /api/auth/login` — 登录（body: username, password）

### 用户（需 JWT）

- `GET /api/users/profile` — 获取当前用户资料  
  Header: `Authorization: Bearer <token>`

### 文档（需 JWT）

以下接口均需 Header：`Authorization: Bearer <token>`。

- `POST /api/documents/upload` — 上传文档（body: title, content）
- `GET /api/documents/list` — 文档列表
- `GET /api/documents/stats` — 上传统计（今日数、总数、总大小、每日统计）
- `GET /api/documents/search?q=关键词` — 搜索文档
- `GET /api/documents/:id` — 获取单篇文档
- `PUT /api/documents/:id` — 更新文档（body: title, content）
- `DELETE /api/documents/:id` — 删除文档

### 其他

- `GET /health` — 健康检查（无需认证）
