<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Message, Lock, Cellphone, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'
import { sendPhoneCode } from '@/api/system'

const emit = defineEmits(['success', 'switch-tab'])
const userStore = UserStore()

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let timer: any = null

const mode = ref<'email' | 'phone' | 'phoneCode'>('email')
const loginFormRef = ref<FormInstance>()

const emailForm = reactive({ email: '', password: '' })
const phoneForm = reactive({ phone: '', password: '' })
const phoneCodeForm = reactive({ phone: '', verificationCode: '' })

const emailRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\W]{8,18}$/, message: '8-18位两种字符组合', trigger: 'blur' },
  ],
}
const phoneRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\W]{8,18}$/, message: '8-18位两种字符组合', trigger: 'blur' },
  ],
}
const phoneCodeRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^[0-9a-zA-Z]{6}$/, message: '验证码为6位字符', trigger: 'blur' },
  ],
}

const currentModel = computed(() => {
  if (mode.value === 'email') return emailForm
  if (mode.value === 'phone') return phoneForm
  return phoneCodeForm
})
const currentRules = computed(() => {
  if (mode.value === 'email') return emailRules
  if (mode.value === 'phone') return phoneRules
  return phoneCodeRules
})

const handleSendPhoneCode = async () => {
  if (sendingCode.value || countdown.value) return
  const phone = phoneCodeForm.phone
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.warning('请输入有效手机号')
    return
  }
  sendingCode.value = true
  try {
    const res = await sendPhoneCode(phone)
    if (res.code === 0) {
      ElMessage.success('验证码已发送')
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      let result
      if (mode.value === 'email') {
        result = await userStore.userLogin(emailForm)
      } else if (mode.value === 'phone') {
        result = await userStore.userPhoneLogin(phoneForm)
      } else {
        result = await userStore.userPhoneCodeLogin(phoneCodeForm)
      }
      if (result.success) {
        ElMessage.success(result.message)
        emit('success')
      } else {
        ElMessage.error(result.message)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

function switchToRegister() { emit('switch-tab', 'register') }
function switchToReset() { emit('switch-tab', 'reset') }

// 构造支付宝授权地址
const buildAlipayAuthUrl = () => {
  const appId = (import.meta as any).env.VITE_ALIPAY_APP_ID
  // 根据路由模式拼接回调
  // 优先使用后端回调地址（推荐）：VITE_ALIPAY_REDIRECT
  const modeEnv = (import.meta as any).env.VITE_ROUTER_MODE
  const defaultFrontendCb = `${location.origin}${modeEnv === 'hash' ? '/#' : ''}/auth/alipay`
  const redirectUri = encodeURIComponent((import.meta as any).env.VITE_ALIPAY_REDIRECT || defaultFrontendCb)
  const host = (import.meta as any).env.VITE_ALIPAY_AUTH_HOST || 'https://openauth.alipay.com'
  // 生成随机state，后端可用于CSRF校验（若后端未校验可忽略）
  const state = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`)
  try { sessionStorage.setItem('alipay_oauth_state', state) } catch { /* ignore */ }
  return `${host}/oauth2/publicAppAuthorize.htm?app_id=${appId}&scope=auth_user&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`
}
const goAlipay = () => {
  const url = buildAlipayAuthUrl()
  if (!url || url.includes('undefined')) {
    ElMessage.error('请配置 VITE_ALIPAY_APP_ID 与回调地址')
    return
  }
  window.location.href = url
}
</script>

<template>
  <div class="login-container">
    <div class="mode-toggle">
      <el-radio-group v-model="mode" size="small" class="mode-group">
        <el-radio-button label="email">邮箱密码</el-radio-button>
        <el-radio-button label="phone">手机号密码</el-radio-button>
        <el-radio-button label="phoneCode">手机号验证码</el-radio-button>
      </el-radio-group>
    </div>
    <!-- <p class="form-subtitle">{{ mode==='email' ? '使用邮箱登录' : (mode==='phone' ? '使用手机号+密码登录' : '使用手机号+验证码登录') }}</p> -->

    <el-form ref="loginFormRef" :model="currentModel" :rules="currentRules" label-width="0" size="large" @keyup.enter="handleLogin">
      <template v-if="mode==='email'">
        <el-form-item prop="email">
          <el-input v-model="emailForm.email" placeholder="邮箱" :prefix-icon="Message" />
        </el-form-item>
        <el-form-item prop="password" class="mt-6">
          <el-input v-model="emailForm.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
      </template>
      <template v-else-if="mode==='phone'">
        <el-form-item prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="手机号" :prefix-icon="Cellphone" />
        </el-form-item>
        <el-form-item prop="password" class="mt-6">
          <el-input v-model="phoneForm.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item prop="phone">
          <el-input v-model="phoneCodeForm.phone" placeholder="手机号" :prefix-icon="Cellphone">
            <template #append>
              <el-button :disabled="countdown>0" @click="handleSendPhoneCode">{{ countdown? countdown+'s' : '获取验证码' }}</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="verificationCode" class="mt-6">
          <el-input v-model="phoneCodeForm.verificationCode" placeholder="验证码" :prefix-icon="Key" />
        </el-form-item>
      </template>

      <div class="forgot-password">
        <a href="#" @click.prevent="switchToReset">忘记密码？</a>
      </div>

      <el-form-item class="mt-4">
        <el-button class="submit-btn" type="primary" :loading="loading" @click="handleLogin">登录</el-button>
      </el-form-item>
    </el-form>

    <div class="divider">
      <span>或</span>
    </div>
    <div class="third-login">
      <el-button plain @click="goAlipay">支付宝登录</el-button>
    </div>

    <p class="signup-text">没有账户？<a href="#" @click.prevent="switchToRegister">注册</a></p>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.mode-toggle {
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}
.mode-group :deep(.el-radio-button__inner) { padding: 6px 14px; }

.form-subtitle {
  color: #666;
  margin-bottom: 24px;
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
  height: 40px;
  font-size: 16px;
}

.divider { display:flex; align-items:center; justify-content:center; gap:8px; color:#999; font-size:12px; margin: 8px 0 4px; }
.divider::before, .divider::after { content:''; height:1px; background: var(--el-border-color-light); flex:1; }
.third-login { display:flex; justify-content:center; margin-top:8px; }

.signup-text {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.signup-text a {
  color: #2a68fa;
  font-weight: 600;
  text-decoration: none;
}

.signup-text a:hover {
  text-decoration: underline;
}

.forgot-password {
  text-align: right;
  margin: -10px 0 10px;
}

.forgot-password a {
  color: #666;
  font-size: 14px;
  text-decoration: none;
}

.forgot-password a:hover {
  color: #2a68fa;
  text-decoration: underline;
}
</style>
