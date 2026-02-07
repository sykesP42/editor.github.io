import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export function useAuth() {
  const router = useRouter()
  
  // 模拟用户状态
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || null)
  
  const isAuthenticated = computed(() => !!user.value || !!token.value)
  
  // 模拟登录
  const login = async (username, password, remember = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username && password) {
          const mockUser = {
            id: 1,
            username,
            email: `${username}@example.com`,
            avatar: `https://ui-avatars.com/api/?name=${username}`
          }
          
          user.value = mockUser
          token.value = 'mock_jwt_token_' + Date.now()
          
          if (remember) {
            localStorage.setItem('auth_token', token.value)
            localStorage.setItem('user', JSON.stringify(mockUser))
          }
          
          resolve({ success: true, user: mockUser })
        } else {
          reject({ success: false, message: '用户名或密码错误' })
        }
      }, 1000)
    })
  }
  
  // 登出
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }
  
  // 初始化时从localStorage恢复用户信息
  const initAuth = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }
  }
  
  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    initAuth
  }
}