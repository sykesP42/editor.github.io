<template>
  <div class="community-container" :data-theme="theme">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="logo">
        <span class="logo-icon">💬</span>
        <span>创作社区</span>
      </div>
      <div class="nav-btns">
        <button class="btn" @click="goToEditor">
          <span class="nav-icon">✏️</span>
          <span>去编辑</span>
        </button>
        <button class="btn refresh-btn" :disabled="loading" @click="fetchPosts">
          <span class="nav-icon">{{ loading ? '⏳' : '🔄' }}</span>
          <span>刷新</span>
        </button>
        <button
          class="btn login-btn"
          @click="handleAccountAction"
        >
          <span class="nav-icon">{{ isAuthenticated ? '🚪' : '👤' }}</span>
          <span>{{ isAuthenticated ? '登出' : '登录' }}</span>
        </button>
        <button class="btn theme-btn" @click="toggleTheme">
          <span class="nav-icon">{{ themeIcon }}</span>
        </button>
      </div>
    </header>

    <!-- 主内容区（参考根目录 index 的 container + content 结构） -->
    <main class="home-main content">
      <section class="home-banner header">
        <h1 class="header-title">创作者交流社区</h1>
        <p>短帖信息流，支持图片与视频。点击卡片查看详情，登录后可点赞互动。</p>
      </section>

      <!-- 加载/错误状态 -->
      <div v-if="loading && !posts.length" class="list-state">加载中…</div>
      <div v-else-if="error" class="list-state list-state-error">{{ error }}</div>

      <!-- 帖子列表：网格布局，参考 style.css 的 .list -->
      <div v-else class="list posts-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="list-item post-card"
          @click="openModal(post)"
        >
          <div class="post-header">
            <img
              :src="post.author_avatar || defaultAvatar(post.author_name)"
              :alt="post.author_name"
              class="avatar"
            />
            <div class="post-info">
              <span class="author-name">{{ post.author_name || '匿名' }}</span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
            <span v-if="post.media_type" class="post-tag">{{ post.media_type === 'video' ? '视频' : '图片' }}</span>
          </div>
          <h3 class="item-title">{{ post.title }}</h3>
          <p class="item-desc">{{ shortContent(post.content) }}</p>
          <!-- 列表缩略：有图/视频时显示小图或占位 -->
          <div v-if="post.media_url" class="post-media-thumb">
            <img
              v-if="post.media_type === 'image'"
              :src="post.media_url"
              :alt="post.title"
              class="thumb-img"
              loading="lazy"
            />
            <div v-else-if="post.media_type === 'video'" class="thumb-video">
              <span class="thumb-video-icon">▶</span> 视频
            </div>
          </div>
          <div class="post-footer">
            <button
              class="action-btn"
              :class="{ liked: post._liked }"
              :disabled="!isAuthenticated"
              @click.stop="handleLike(post)"
            >
              <span class="action-icon">❤️</span>
              {{ post.likes_count ?? post.likes }}
            </button>
            <button class="action-btn" disabled>
              <span class="action-icon">💬</span>
              {{ post.comments_count ?? post.comments ?? 0 }}
            </button>
          </div>
        </div>
      </div>

      <!-- 详情弹窗（参考 index 的 modal） -->
      <div
        class="modal"
        :class="{ 'modal-visible': detailPost }"
        @click.self="closeModal"
      >
        <div class="modal-content">
          <span class="close-btn" @click="closeModal">&times;</span>
          <template v-if="detailPost">
            <div class="modal-header">
              <img
                :src="detailPost.author_avatar || defaultAvatar(detailPost.author_name)"
                :alt="detailPost.author_name"
                class="avatar"
              />
              <div class="post-info">
                <span class="author-name">{{ detailPost.author_name || '匿名' }}</span>
                <span class="post-time">{{ formatTime(detailPost.created_at) }}</span>
              </div>
            </div>
            <h2 class="modal-title">{{ detailPost.title }}</h2>
            <p class="modal-desc">{{ detailPost.content }}</p>
            <!-- 详情中的图片/视频 -->
            <div v-if="detailPost.media_url" class="modal-media">
              <img
                v-if="detailPost.media_type === 'image'"
                :src="detailPost.media_url"
                :alt="detailPost.title"
                class="modal-media-img"
              />
              <video
                v-else-if="detailPost.media_type === 'video'"
                :src="detailPost.media_url"
                controls
                class="modal-media-video"
              />
            </div>
            <div class="modal-footer">
              <button
                class="action-btn"
                :class="{ liked: detailPost._liked }"
                :disabled="!isAuthenticated"
                @click="handleLike(detailPost)"
              >
                <span class="action-icon">❤️</span>
                {{ detailPost.likes_count ?? detailPost.likes }}
              </button>
              <span class="action-btn static">
                <span class="action-icon">💬</span>
                {{ detailPost.comments_count ?? detailPost.comments ?? 0 }} 评论
              </span>
            </div>
          </template>
        </div>
      </div>
    </main>

    <footer class="home-footer">
      <p>© 2025 轻量编辑器 - 社区交流，灵感碰撞</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useTheme } from '../composables/useTheme'
import { postAPI } from '../services/api'
import '../styles/community.css'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()
const { theme, toggleTheme } = useTheme()
const themeIcon = computed(() => (theme.value === 'dark' ? '☀️' : '🌙'))

const posts = ref([])
const loading = ref(false)
const error = ref(null)
const detailPost = ref(null)

const defaultAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '匿名')}&background=random`

function shortContent(text, max = 60) {
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max) + '…'
}

function formatTime(createdAt) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return date.toLocaleDateString('zh-CN')
}

async function fetchPosts() {
  loading.value = true
  error.value = null
  try {
    const res = await postAPI.list({ page: 1, limit: 30 })
    if (res?.success && res?.data?.list) {
      posts.value = (res.data.list || []).map((p) => ({ ...p, _liked: false }))
    } else {
      posts.value = []
      error.value = '加载帖子列表失败'
    }
  } catch (e) {
    posts.value = []
    error.value = e?.message || e?.error || '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

function openModal(post) {
  detailPost.value = post
}

function closeModal() {
  detailPost.value = null
}

async function handleLike(post) {
  if (!isAuthenticated.value) return
  const prevCount = post.likes_count ?? post.likes ?? 0
  const prevLiked = post._liked
  // 即时反馈：先更新 UI
  post._liked = true
  post.likes_count = prevCount + 1
  if (detailPost.value && detailPost.value.id === post.id) {
    detailPost.value._liked = true
    detailPost.value.likes_count = post.likes_count
  }
  try {
    const res = await postAPI.like(post.id)
    if (res?.success && res?.data?.likes_count != null) {
      post.likes_count = res.data.likes_count
      if (detailPost.value && detailPost.value.id === post.id) {
        detailPost.value.likes_count = res.data.likes_count
      }
    } else {
      throw new Error('点赞失败')
    }
  } catch (e) {
    post._liked = prevLiked
    post.likes_count = prevCount
    if (detailPost.value && detailPost.value.id === post.id) {
      detailPost.value._liked = prevLiked
      detailPost.value.likes_count = prevCount
    }
    error.value = e?.message || e?.error || '点赞失败，请重试'
    setTimeout(() => { error.value = null }, 2000)
  }
}

function goToEditor() {
  router.push('/editor')
}

function handleAccountAction() {
  if (isAuthenticated.value) {
    if (confirm('确定要退出登录吗？')) logout()
  } else {
    router.push('/login')
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.community-container {
  min-height: 100vh;
  background-color: var(--bg);
  color: var(--text);
}

.list-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text);
  opacity: 0.8;
}

.list-state-error {
  color: #e74c3c;
}

/* 参考根目录 style.css：列表网格 */
.content {
  min-height: calc(100vh - 120px);
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.list-item {
  background: var(--panel);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border);
}

.list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .list-item {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .list-item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.item-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 10px;
  color: var(--text);
}

.item-desc {
  font-size: 14px;
  color: var(--text);
  opacity: 0.75;
  line-height: 1.5;
}

.post-media-thumb {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--border);
}

.thumb-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.thumb-video {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  opacity: 0.8;
}

.thumb-video-icon {
  margin-right: 6px;
  font-size: 1.2rem;
}

.post-footer {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text);
  opacity: 0.7;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.action-btn:hover:not(:disabled):not(.static) {
  background: var(--bg);
  color: #42b983;
  opacity: 1;
}

.action-btn.liked {
  color: #e74c3c;
  opacity: 1;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.action-btn.static {
  cursor: default;
}

.action-icon {
  font-size: 1rem;
  line-height: 1;
}

/* 弹窗：参考根目录 style.css .modal */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-visible {
  display: flex;
}

.modal-content {
  background: var(--panel);
  border-radius: 12px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px 30px;
  position: relative;
  border: 1px solid var(--border);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 24px;
  color: var(--text);
  opacity: 0.7;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.modal-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.modal-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
}

.modal-desc {
  font-size: 16px;
  color: var(--text);
  opacity: 0.9;
  line-height: 1.7;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.modal-media {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg);
}

.modal-media-img {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  display: block;
}

.modal-media-video {
  width: 100%;
  max-height: 360px;
  display: block;
}

.modal-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* 响应式 */
@media (max-width: 768px) {
  .list {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-content {
    padding: 20px;
  }

  .home-banner.header .header-title {
    font-size: 1.5rem;
  }
}
</style>
