import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'
import { UserState } from '@/stores/interface'
import { login, logout, getUserInfo, phoneLogin, phoneCodeLogin, alipayLogin as apiAlipayLogin } from '@/api/system'
import { ElMessage } from 'element-plus'
import { AudioStore } from './audio'

interface UserInfo {
  userId?: number
  username?: string
  phone?: string
  email?: string
  avatarUrl?: string
  introduction?: string
  token?: string
}

/**
 * 用户信息
 */
export const UserStore = defineStore('UserStore', {
  state: (): UserState => ({
    userInfo: {} as UserInfo,
    isLoggedIn: false,
  }),
  actions: {
    // 去掉可能的 Bearer 前缀
    _stripBearer(token: string) {
      return (token || '').replace(/^Bearer\s+/i, '')
    },
    // 设置用户信息
    setUserInfo(userInfo: any, token?: string) {
      this.userInfo = {
        userId: userInfo.userId,
        username: userInfo.username,
        phone: userInfo.phone,
        email: userInfo.email,
        avatarUrl: userInfo.userAvatar,
        introduction: userInfo.introduction,
        token: token
      }
      this.isLoggedIn = true
    },
    // 支付宝登录（根据回调 authCode 换 token 并获取用户信息）
    async alipayLogin(authCode: string) {
      try {
        const response = await apiAlipayLogin({ authCode })
        if (response.code === 0) {
          const token = this._stripBearer(response.data as string)
          this.userInfo = { token }
          try {
            const userInfoResponse = await getUserInfo()
            if (userInfoResponse.code === 0) {
              this.setUserInfo(userInfoResponse.data, token)
              return { success: true, message: '登录成功' }
            }
            return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
          } catch (error: any) {
            return { success: false, message: error.message || '获取用户信息失败' }
          }
        }
        return { success: false, message: response.message || '登录失败' }
      } catch (error: any) {
        return { success: false, message: error.message || '登录失败' }
      }
    },
    // OAuth 回调场景：后端已完成 code 交换并重定向携带 token
    async oauthLoginWithToken(token: string) {
      if (!token) return { success: false, message: '缺少token' }
      token = this._stripBearer(token)
      this.userInfo = { token }
      try {
        const userInfoResponse = await getUserInfo()
        if (userInfoResponse.code === 0) {
          this.setUserInfo(userInfoResponse.data, token)
          ElMessage.success('登录成功')
          return { success: true, message: '登录成功' }
        }
        this.clearUserInfo()
        ElMessage.error(userInfoResponse.message || '获取用户信息失败')
        return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
      } catch (e: any) {
        this.clearUserInfo()
        ElMessage.error(e?.message || '获取用户信息失败')
        return { success: false, message: e?.message || '获取用户信息失败' }
      }
    },
    // 更新头像
    updateUserAvatar(avatarUrl: string) {
      if (this.userInfo) {
        this.userInfo.avatarUrl = avatarUrl
      }
    },
    // 清除用户信息
    clearUserInfo() {
      this.userInfo = {}
      this.isLoggedIn = false
      try {
        // 确保本地持久化的 token 被移除
        localStorage.removeItem('UserStore')
      } catch {
        // ignore
      }

      // 清空所有歌曲的喜欢状态
      const audioStore = AudioStore()
      // 清空播放列表中的喜欢状态
      audioStore.trackList.forEach(track => {
        track.likeStatus = 0
      })
      // 清空当前页面歌曲列表中的喜欢状态
      if (audioStore.currentPageSongs) {
        audioStore.currentPageSongs.forEach(song => {
          song.likeStatus = 0
        })
      }
    },
    // 用户登录
    async userLogin(loginData: { email: string; password: string }) {
      try {
        const response = await login(loginData)

        if (response.code === 0) {
          // 先保存token
          const token = this._stripBearer(response.data as string)
          
          // 设置token到userInfo
          this.userInfo = { token }

          try {
            // 再获取用户信息
            const userInfoResponse = await getUserInfo()
            
            if (userInfoResponse.code === 0) {
              this.setUserInfo(userInfoResponse.data, token)
              return { success: true, message: '登录成功' }
            }
            return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
          } catch (error: any) {
            return { success: false, message: error.message || '获取用户信息失败' }
          }
        }
        return { success: false, message: response.message || '登录失败' }
      } catch (error: any) {
        return { success: false, message: error.message || '登录失败' }
      }
    },
    // 手机号+密码登录
    async userPhoneLogin(loginData: { phone: string; password: string }) {
      try {
        const response = await phoneLogin(loginData)
        if (response.code === 0) {
          const token = this._stripBearer(response.data as string)
          this.userInfo = { token }
          try {
            const userInfoResponse = await getUserInfo()
            if (userInfoResponse.code === 0) {
              this.setUserInfo(userInfoResponse.data, token)
              return { success: true, message: '登录成功' }
            }
            return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
          } catch (error: any) {
            return { success: false, message: error.message || '获取用户信息失败' }
          }
        }
        return { success: false, message: response.message || '登录失败' }
      } catch (error: any) {
        return { success: false, message: error.message || '登录失败' }
      }
    },
    // 手机号+验证码登录
    async userPhoneCodeLogin(loginData: { phone: string; verificationCode: string }) {
      try {
        const response = await phoneCodeLogin(loginData)
        if (response.code === 0) {
          const token = this._stripBearer(response.data as string)
          this.userInfo = { token }
          try {
            const userInfoResponse = await getUserInfo()
            if (userInfoResponse.code === 0) {
              this.setUserInfo(userInfoResponse.data, token)
              return { success: true, message: '登录成功' }
            }
            return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
          } catch (error: any) {
            return { success: false, message: error.message || '获取用户信息失败' }
          }
        }
        return { success: false, message: response.message || '登录失败' }
      } catch (error: any) {
        return { success: false, message: error.message || '登录失败' }
      }
    },
    // 用户退出
    async userLogout() {
      try {
        const response = await logout()
        const ok =
          !response ||
          typeof response !== 'object' ||
          (response as any).code === 0 ||
          (response as any).code === 200 ||
          /成功|success/i.test((response as any)?.message || '')
        if (ok) {
          this.clearUserInfo()
          return { success: true, message: '退出成功' }
        }
        return { success: false, message: response?.message || '退出失败' }
      } catch {
        // 即使接口异常也清理本地登录态，避免残留
        this.clearUserInfo()
        return { success: true, message: '已清理本地登录态' }
      }
    }
  },
  persist: piniaPersistConfig('UserStore'),
})
