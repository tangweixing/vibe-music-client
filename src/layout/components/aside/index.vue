<script setup lang="ts">
import { MenuData } from './data'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import { UserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'
import AuthTabs from '@/components/Auth/AuthTabs.vue'
import { useFavoriteStore } from '@/stores/modules/favorite'
import { useMyPlaylistsStore } from '@/stores/modules/myPlaylists'
import PlaylistFormDialog from '@/components/Playlist/PlaylistFormDialog.vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const user = UserStore()
const favoriteStore = useFavoriteStore()
const myPlaylistsStore = useMyPlaylistsStore()
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const editInitialData = ref<any>(null)
// 折叠创建的歌单
const showMyPlaylists = ref(true)
const toggleMyPlaylists = () => {
  showMyPlaylists.value = !showMyPlaylists.value
}
// 折叠收藏的歌单
const showFavoritePlaylists = ref(true)
const toggleFavoritePlaylists = () => {
  showFavoritePlaylists.value = !showFavoritePlaylists.value
}
// 收藏歌单右键菜单
const favoriteContextMenuVisible = ref(false)
const favoriteContextMenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const favoriteContextMenuTargetId = ref<number | null>(null)

const openFavoriteContextMenu = (e: MouseEvent, id: number) => {
  e.preventDefault()
  favoriteContextMenuTargetId.value = id
  favoriteContextMenuStyle.value = { top: e.clientY + 'px', left: e.clientX + 'px' }
  favoriteContextMenuVisible.value = true
  document.addEventListener('click', closeFavoriteContextMenu, { once: true })
}

const closeFavoriteContextMenu = () => {
  favoriteContextMenuVisible.value = false
}

const handleCancelFavorite = async () => {
  if (!favoriteContextMenuTargetId.value) return
  try {
    await ElMessageBox.confirm('确定取消收藏该歌单？', '取消收藏', { type: 'warning' })
    await favoriteStore.cancelCollectPlaylist(favoriteContextMenuTargetId.value)
  } catch {
    // 取消操作
  }
  closeFavoriteContextMenu()
}
const authVisible = ref(false)

// 处理需要登录的路由
const handleProtectedRoute = (path: string) => {
  if (!user.isLoggedIn && (path === '/like' || path === '/user' || path === '/wallet')) {
    ElMessage.warning('请先登录')
    authVisible.value = true
    return false
  }
  return true
}

// 监听用户登录状态
watch(
  () => user.isLoggedIn,
  (newVal) => {
    if (newVal) {
      favoriteStore.getFavoritePlaylists()
      myPlaylistsStore.fetchMyPlaylists()
    } else {
      favoriteStore.clearFavoritePlaylists()
      myPlaylistsStore.myPlaylists = []
    }
  },
  { immediate: true }
)

// 右键菜单逻辑
const contextMenuVisible = ref(false)
const contextMenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const contextMenuTargetId = ref<number | null>(null)

const openContextMenu = (e: MouseEvent, id: number) => {
  e.preventDefault()
  contextMenuTargetId.value = id
  contextMenuStyle.value = { top: e.clientY + 'px', left: e.clientX + 'px' }
  contextMenuVisible.value = true
  document.addEventListener('click', closeContextMenu, { once: true })
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleEdit = () => {
  if (contextMenuTargetId.value) {
    const item = myPlaylistsStore.myPlaylists.find(p => p.id === contextMenuTargetId.value)
    if (item) {
      editInitialData.value = { playlistId: item.id, title: item.title, isPublic: true, introduction: '', style: '', coverUrl: item.coverUrl }
      editDialogVisible.value = true
    }
  }
  closeContextMenu()
}

const handleDelete = async () => {
  if (!contextMenuTargetId.value) return
  try {
    await ElMessageBox.confirm('确定删除该歌单？此操作不可恢复', '删除确认', { type: 'warning' })
    await myPlaylistsStore.delete(contextMenuTargetId.value)
  } catch {
    // 取消
  }
  closeContextMenu()
}
</script>

<template>
  <aside class="w-64 hidden h-full overflow-hidden md:block border-r shadow-2xl shadow-blue-500/50">
    <nav class="flex flex-col p-4 space-y-4 flex-1 h-full box-border overflow-hidden">
      <div v-for="(item, index) in MenuData" :key="index" class="w-full flex flex-col gap-1">
        <h3 class="ml-4 text-sm font-semibold text-inactive">
          {{ item.title }}
        </h3>
        <div v-for="(item2, index2) in item.children" :key="index2"
          class="mx-2 rounded-lg transition text-lg duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer"
          :class="{
            'bg-activeMenuBg': route.path === item2.router,
            'hover:bg-hoverMenuBg': route.path !== item2.router,
          }" @click="handleProtectedRoute(item2.router) && router.push(item2.router)">
          <Icon :icon="item2.icon" />
          <span>{{ item2.title }}</span>
          <span class="!ml-auto text-xs text-primary-foreground bg-emphasis border-border p-1 rounded-lg"></span>
        </div>
      </div>

      <!-- 收藏的歌单 -->
      <div class="w-full flex flex-col gap-1" v-if="user.isLoggedIn">
        <div class="flex items-center gap-1 ml-2 cursor-pointer select-none" @click="toggleFavoritePlaylists">
          <Icon :icon="showFavoritePlaylists ? 'mdi:chevron-down' : 'mdi:chevron-right'" class="text-lg" />
          <h3 class="text-sm font-semibold text-inactive">收藏的歌单（{{ favoriteStore.favoritePlaylists.length }}）</h3>
        </div>
        <transition name="el-fade-in">
        <el-scrollbar v-show="showFavoritePlaylists" class="max-h-64 pr-1">
          <el-skeleton :loading="favoriteStore.loading" animated :count="3" v-if="favoriteStore.loading">
            <template #template>
              <div class="flex items-center space-x-2 p-2 mx-2">
                <el-skeleton-item variant="image" style="width: 28px; height: 28px" />
                <el-skeleton-item variant="text" style="width: 130px" />
              </div>
            </template>
          </el-skeleton>

          <template v-else>
            <div v-for="item in favoriteStore.favoritePlaylists" :key="item.id"
              class="mx-2 my-1 rounded-lg transition text-sm duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer"
              :class="{
                'bg-activeMenuBg': route.path === `/playlist/${item.id}`,
                'hover:bg-hoverMenuBg': route.path !== `/playlist/${item.id}`,
              }" @click="router.push(`/playlist/${item.id}`)" @contextmenu="openFavoriteContextMenu($event, item.id)">
              <el-image lazy :src="item.coverImgUrl + '?param=50y50'" class="w-10 h-10 rounded-md flex-shrink-0"
                :alt="item.name" />
              <div class="flex-1 min-w-0">
                <span class="line-clamp-2 text-sm leading-normal">{{ item.name }}</span>
              </div>
            </div>
          </template>
        </el-scrollbar>
        </transition>
      </div>

      <!-- 我创建的歌单 -->
      <div class="w-full flex flex-col gap-1" v-if="user.isLoggedIn">
        <div class="flex items-center justify-between pr-2">
          <div class="flex items-center gap-1 ml-2 cursor-pointer select-none" @click="toggleMyPlaylists">
            <Icon :icon="showMyPlaylists ? 'mdi:chevron-down' : 'mdi:chevron-right'" class="text-lg" />
            <h3 class="text-sm font-semibold text-inactive">创建的歌单（{{ myPlaylistsStore.myPlaylists.length }}）</h3>
          </div>
          <div class="flex items-center gap-1">
            <el-button link type="primary" size="small" @click.stop="createDialogVisible = true">
              <Icon icon="mdi:plus" />
            </el-button>
          </div>
        </div>
        <transition name="el-fade-in">
        <el-scrollbar v-show="showMyPlaylists" class="max-h-64 pr-1">
          <el-skeleton :loading="myPlaylistsStore.loading" animated :count="3" v-if="myPlaylistsStore.loading">
            <template #template>
              <div class="flex items-center space-x-2 p-2 mx-2">
                <el-skeleton-item variant="image" style="width: 28px; height: 28px" />
                <el-skeleton-item variant="text" style="width: 130px" />
              </div>
            </template>
          </el-skeleton>
          <template v-else>
            <div v-for="item in myPlaylistsStore.myPlaylists" :key="item.id"
              class="mx-2 my-1 rounded-lg transition text-sm duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer"
              :class="{ 'bg-activeMenuBg': route.path === `/playlist/${item.id}`,'hover:bg-hoverMenuBg': route.path !== `/playlist/${item.id}` }"
              @click="router.push(`/playlist/${item.id}`)" @contextmenu="openContextMenu($event, item.id)">
              <el-image lazy :src="(item.coverUrl || '') + '?param=50y50'" class="w-10 h-10 rounded-md flex-shrink-0" :alt="item.title" />
              <div class="flex-1 min-w-0">
                <span class="line-clamp-2 text-sm leading-normal">{{ item.title }}</span>
              </div>
            </div>
          </template>
        </el-scrollbar>
        </transition>
      </div>
    </nav>

    <!-- 登录对话框 -->
    <AuthTabs v-model="authVisible" />

    <!-- 创建歌单对话框 -->
    <PlaylistFormDialog v-model="createDialogVisible" mode="create" @success="myPlaylistsStore.fetchMyPlaylists()" />
    <!-- 编辑歌单对话框 -->
    <PlaylistFormDialog v-model="editDialogVisible" mode="edit" :initial-data="editInitialData" @success="myPlaylistsStore.fetchMyPlaylists()" />

    <!-- 右键菜单 -->
    <transition name="el-fade-in">
      <ul v-if="contextMenuVisible" class="fixed z-50 w-40 bg-white dark:bg-neutral-800 shadow-lg rounded-md py-1 text-sm border" :style="contextMenuStyle">
        <li class="px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer" @click="handleEdit">编辑歌单信息</li>
        <li class="px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-red-600" @click="handleDelete">删除歌单</li>
      </ul>
    </transition>
    <!-- 收藏歌单右键菜单 -->
    <transition name="el-fade-in">
      <ul v-if="favoriteContextMenuVisible" class="fixed z-50 w-36 bg-white dark:bg-neutral-800 shadow-lg rounded-md py-1 text-sm border" :style="favoriteContextMenuStyle">
        <li class="px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-red-600" @click="handleCancelFavorite">取消收藏</li>
      </ul>
    </transition>
  </aside>
</template>
