import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import './styles/main.css'

// 初始化认证状态
const { initAuth } = useAuth()
initAuth()

createApp(App)
  .use(router)
  .mount('#app')