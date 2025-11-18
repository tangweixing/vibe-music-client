import { createApp } from 'vue'
import App from './App.vue'
import router from './routers/index'
import Store from '@/stores'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style/index.scss'
import { UserStore } from '@/stores/modules/user'

const url = new URL(window.location.href)
const redirectToken = url.searchParams.get('token')

const app = createApp(App)
app.use(router)
app.use(Store)
app.use(ElementPlus, { locale: zhCn })

// 先挂载，再处理 token，避免首屏空白感
app.mount('#app')

if (redirectToken) {
  const userStore = UserStore()
  console.log('[OAuth] 检测到重定向 token')
  userStore
    .oauthLoginWithToken(redirectToken)
    .then((res) => {
      if (res.success) {
        // 登录成功后确保跳转首页（无论当前是否已在 /）
        router.replace('/')
      }
    })
    .finally(() => {
      url.searchParams.delete('token')
      const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash
      history.replaceState(null, '', cleanUrl)
    })
}
