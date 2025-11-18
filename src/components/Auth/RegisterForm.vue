<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { User, Message, Lock, Key, Cellphone } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { sendEmailCode, register, sendPhoneCode, phoneRegister } from '@/api/system'

const emit = defineEmits(['success', 'switch-tab'])

const loading = ref(false)
const countdown = ref(0)
const registerFormRef = ref<FormInstance>()

const mode = ref<'email' | 'phone'>('email')
const emailForm = reactive({
  username: '',
  email: '',
  password: '',
  verificationCode: '',
})
const phoneForm = reactive({
  username: '',
  phone: '',
  password: '',
  verificationCode: '',
})

// 表单验证规则
const emailRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]{4,16}$/, message: '4-16位字母数字_-', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\W]{8,18}$/, message: '8-18位两种字符组合', trigger: 'blur' },
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^[0-9a-zA-Z]{6}$/, message: '验证码为6位字符', trigger: 'blur' },
  ],
}
const phoneRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]{4,16}$/, message: '4-16位字母数字_-', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\W]{8,18}$/, message: '8-18位两种字符组合', trigger: 'blur' },
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^[0-9a-zA-Z]{6}$/, message: '验证码为6位字符', trigger: 'blur' },
  ],
}

const currentModel = computed(() => mode.value === 'email' ? emailForm : phoneForm)
const currentRules = computed(() => mode.value === 'email' ? emailRules : phoneRules)

// 发送验证码
const handleSendCode = async () => {
  try {
    if (mode.value === 'email') {
      if (!emailForm.email) { ElMessage.warning('请先输入邮箱'); return }
      const response = await sendEmailCode(emailForm.email)
      if (response.code === 0) {
        ElMessage.success('验证码已发送')
      } else { ElMessage.error(response.message) }
    } else {
      if (!phoneForm.phone) { ElMessage.warning('请先输入手机号'); return }
      const response = await sendPhoneCode(phoneForm.phone)
      if (response.code === 0) { ElMessage.success('验证码已发送') } else { ElMessage.error(response.message) }
    }
    countdown.value = 60
    const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer) }, 1000)
  } catch (error: any) { ElMessage.error(error.message || '发送验证码失败') }
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      let response
      if (mode.value === 'email') {
        response = await register(emailForm)
      } else {
        response = await phoneRegister({
          phone: phoneForm.phone,
          password: phoneForm.password,
          verificationCode: phoneForm.verificationCode,
          username: phoneForm.username,
        })
      }
      if (response.code === 0) {
        ElMessage.success('注册成功，请登录')
        emit('switch-tab', 'login')
      } else {
        ElMessage.error(response.message)
      }
    } catch (error: any) {
      ElMessage.error(error.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

function switchToLogin() {
  // 通知父组件切换到登录标签
  emit('switch-tab', 'login')
}
</script>

<template>
  <div class="register-container">
    <div class="mode-toggle">
      <el-radio-group v-model="mode" size="small" class="mode-group">
        <el-radio-button label="email">邮箱注册</el-radio-button>
        <el-radio-button label="phone">手机号注册</el-radio-button>
      </el-radio-group>
    </div>
    <p class="form-subtitle">{{ mode==='email' ? '使用邮箱注册新账户' : '使用手机号注册新账户' }}</p>
    <el-form ref="registerFormRef" :model="currentModel" :rules="currentRules" label-width="0" size="large" @keyup.enter="handleRegister">
      <el-form-item prop="username">
        <el-input v-model="currentModel.username" placeholder="用户名" :prefix-icon="User" />
      </el-form-item>
      <template v-if="mode==='email'">
        <el-form-item prop="email" class="mt-6">
          <el-input v-model="emailForm.email" placeholder="邮箱" :prefix-icon="Message">
            <template #append>
              <el-button :disabled="!!countdown || loading" @click="handleSendCode">{{ countdown ? countdown+'s后重试' : '获取验证码' }}</el-button>
            </template>
          </el-input>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item prop="phone" class="mt-6">
          <el-input v-model="phoneForm.phone" placeholder="手机号" :prefix-icon="Cellphone">
            <template #append>
              <el-button :disabled="!!countdown || loading" @click="handleSendCode">{{ countdown ? countdown+'s后重试' : '获取验证码' }}</el-button>
            </template>
          </el-input>
        </el-form-item>
      </template>
      <el-form-item prop="verificationCode" class="mt-6">
        <el-input v-model="currentModel.verificationCode" placeholder="验证码" :prefix-icon="Key" />
      </el-form-item>
      <el-form-item prop="password" class="mt-6">
        <el-input v-model="currentModel.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
      </el-form-item>
      <el-form-item class="mt-6">
        <el-button class="submit-btn" type="primary" :loading="loading" @click="handleRegister">注册</el-button>
      </el-form-item>
    </el-form>
    <p class="login-text">已有账户？<a href="#" @click.prevent="switchToLogin">登录</a></p>
  </div>
</template>


<style scoped>
.register-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.mode-toggle { margin-bottom: 12px; display: flex; justify-content: center; }
.mode-group :deep(.el-radio-button__inner) { padding: 6px 16px; }

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

.login-text {
  text-align: center;
  margin-top: 16px;
  color: #666;
}

.login-text a {
  color: #2a68fa;
  font-weight: 600;
  text-decoration: none;
}

.login-text a:hover {
  text-decoration: underline;
}
</style>
