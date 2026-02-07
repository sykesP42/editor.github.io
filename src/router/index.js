import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// 路由懒加载
const EditorView = () => import('../views/EditorView.vue')
const CommunityView = () => import('../views/CommunityView.vue')
const LoginView = () => import('../views/LoginView.vue')

const routes = [
  {
    path: '/',
    redirect: '/editor'
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorView,
    meta: { requiresAuth: false } // 无需登录
  },
  {
    path: '/community',
    name: 'community',
    component: CommunityView,
    meta: { requiresAuth: false } // 可浏览，不可发言
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 验证登录状态
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()
  
  // 如果页面需要登录且用户未登录
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})

export default router