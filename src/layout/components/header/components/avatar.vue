<script setup lang="ts">
import { ref } from 'vue'
import { UserStore } from '@/stores/modules/user'
import { defineAsyncComponent } from 'vue'
const AuthTabs = defineAsyncComponent(() => import('@/components/Auth/AuthTabs.vue'))
const FeedbackDialog = defineAsyncComponent(() => import('@/components/Common/FeedbackDialog.vue'))
import defaultAvatar from '@/assets/user.jpg'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const showLogin = ref(false)
const user = UserStore()
const router = useRouter()
const feedbackDialogRef = ref<any | null>(null)

const handleLogout = async () => {
  const res = await user.userLogout()
  if (res.success) {
    ElMessage.success('退出登录成功')
    router.replace('/')
  } else {
    // 兼容后端返回 200 但消息非 0 的情况，前端仍已清理本地状态
    ElMessage.warning(res.message || '退出可能未完全生效')
  }
}

const openFeedbackDialog = () => {
  feedbackDialogRef.value?.openDialog()
}
</script>

<template>
  <el-dropdown v-if="user.userInfo && user.userInfo.userId" class="cursor-pointer">
    <span class="flex items-center">
      <el-avatar :src="user.userInfo.avatarUrl || defaultAvatar" class="mr-1" shape="circle" :size="32" />
      <span class="text-sm font-medium mr-2 ml-1">{{ user.userInfo.username }}</span>
      <icon-uiw:down />
    </span>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="router.push('/user')">
          <icon-mi:user />&ensp;个人中心
        </el-dropdown-item>
        <el-dropdown-item @click="openFeedbackDialog">
          <icon-feather:edit />&ensp;意见反馈
        </el-dropdown-item>
        <el-dropdown-item @click="handleLogout">
          <icon-pajamas:power />&ensp;退出
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <el-button class="mr-3 rounded-full" v-else type="primary" @click="showLogin = true">
    <div class="flex items-center gap-1">
      <icon-ic:baseline-person-pin />
      登录
    </div>
  </el-button>
  <AuthTabs v-if="showLogin" v-model="showLogin" />
  <FeedbackDialog ref="feedbackDialogRef" />
</template>
