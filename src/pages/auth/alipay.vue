<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()
const status = ref<'loading'|'success'|'fail'>('loading')
const message = ref('正在通过支付宝登录...')

onMounted(async () => {
  // 支付宝回调通常为 auth_code，也兼容 authCode
  const authCode = (route.query.auth_code as string) || (route.query.authCode as string)
  if (!authCode) {
    status.value = 'fail'
    message.value = '缺少授权码 auth_code'
    return
  }
  const res = await userStore.alipayLogin(authCode)
  if (res.success) {
    status.value = 'success'
    message.value = '登录成功，正在返回...'
    ElMessage.success('登录成功')
    // 回到首页或回上一页
    const back = (route.query.redirect as string) || '/'
    router.replace(back)
  } else {
    status.value = 'fail'
    message.value = res.message || '支付宝登录失败'
    ElMessage.error(message.value)
  }
})
</script>

<template>
  <div class="wrap">
    <el-result :icon="status==='loading' ? 'info' : (status==='success' ? 'success' : 'error')" title="支付宝登录" :sub-title="message" />
  </div>
</template>

<style scoped>
.wrap { height: 60vh; display:flex; align-items:center; justify-content:center; }
</style>
