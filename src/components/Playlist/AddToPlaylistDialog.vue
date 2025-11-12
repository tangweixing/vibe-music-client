<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMyPlaylistsStore } from '@/stores/modules/myPlaylists'
import PlaylistFormDialog from './PlaylistFormDialog.vue'
import { addSongsToPlaylist, removeSongsFromPlaylist, getPlaylistDetail } from '@/api/system'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  songIds: number[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])
const store = useMyPlaylistsStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const createDialogVisible = ref(false)
const loading = ref(false)
const membership = ref<Record<number, boolean>>({})

/**
 * 强制加载全部歌单
 * 如果你的 fetchMyPlaylists 支持分页参数，请使用大 pageSize。
 * 若不支持，可在 store 里实现一个一次性返回全部的接口。
 */
const fetchAllPlaylists = async () => {
  // 推荐：在 store 中实现 fetchMyPlaylists({ page:1, pageSize:999 })
  try {
    await store.fetchMyPlaylists({ page: 1, pageSize: 999 })
  } catch {
    // 如果没有分页参数，可使用下面的循环方式（自行替换成真实 API）：
    // const all: any[] = []
    // let page = 1
    // while (true) {
    //   const res = await apiGetMyPlaylists({ page, pageSize: 50 })
    //   if (!res.data.list.length) break
    //   all.push(...res.data.list)
    //   if (res.data.list.length < 50) break
    //   page++
    // }
    // store.setMyPlaylists(all)
  }
}

const buildMembership = async () => {
  membership.value = {}
  if (!props.songIds?.length) return
  loading.value = true
  try {
    const jobs = store.myPlaylists.map(async (p) => {
      const res = await getPlaylistDetail(p.id)
      if (res.code === 0 && (res as any).data?.songs) {
        const ids: number[] = (res as any).data.songs.map((s: any) => s.songId)
        membership.value[p.id] = props.songIds.every(id => ids.includes(id))
      } else {
        membership.value[p.id] = false
      }
    })
    await Promise.all(jobs)
  } catch {
    // 忽略错误
  } finally {
    loading.value = false
  }
}

const loadList = async (forceReload = false) => {
  if (forceReload) {
    await fetchAllPlaylists()
  } else if (!store.myPlaylists.length) {
    await fetchAllPlaylists()
  }
  await buildMembership()
}

// 初次挂载不强制，可让后续打开弹窗再刷新
onMounted(() => loadList(false))

// 监听打开，每次强制刷新全量（保证新创建、刚被修改的歌单出现）
watch(() => visible.value, (v) => {
  if (v) {
    loadList(true)
  }
})

const handleSelect = async (playlistId: number) => {
  if (!props.songIds?.length) return
  const isIn = membership.value[playlistId]
  const api = isIn ? removeSongsFromPlaylist : addSongsToPlaylist
  const tipOk = isIn ? '已从歌单移除' : '已添加到歌单'
  const tipFail = isIn ? '移除失败' : '添加失败'
  const res = await api(playlistId, props.songIds)
  if (res.code === 0) {
    membership.value[playlistId] = !isIn
    ElMessage.success(tipOk)
    emit('success')
  } else {
    ElMessage.error(res.message || tipFail)
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @close="visible = false"
    title="收藏到歌单"
    width="520px"
    class="add-to-playlist-dialog"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm text-inactive">默认排序</div>
      <el-button type="primary" plain size="small" @click="createDialogVisible = true">
        <icon-mdi:plus class="mr-1" /> 创建新歌单
      </el-button>
    </div>

    <el-scrollbar class="playlist-scroll">
      <div class="space-y-1 pr-2">
        <div
          v-for="p in store.myPlaylists"
          :key="p.id"
          class="flex items-center gap-3 p-2 rounded-md hover:bg-hoverMenuBg cursor-pointer"
          @click="handleSelect(p.id)"
        >
          <el-image :src="(p.coverUrl || '') + '?param=80y80'" class="w-12 h-12 rounded" />
          <div class="flex-1 min-w-0">
            <div class="text-sm line-clamp-1">{{ p.title }}</div>
          </div>
          <div class="w-12 flex justify-end pr-2">
            <icon-mdi:minus-box-outline v-if="membership[p.id]" class="text-lg text-red-500" />
            <icon-mdi:plus-box-outline v-else class="text-lg" />
          </div>
        </div>
        <div v-if="!store.myPlaylists.length && !loading" class="text-center text-xs text-inactive py-6">
          暂无歌单
        </div>
        <div v-if="loading" class="text-center text-xs text-inactive py-4">加载中...</div>
      </div>
    </el-scrollbar>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>

    <PlaylistFormDialog
      v-model="createDialogVisible"
      mode="create"
      @success="loadList(true)"
    />
  </el-dialog>
</template>

<style scoped>
.playlist-scroll {
  /* 固定高度 + 允许滚动 */
  height: 380px;
}
</style>

<style>
/* 可选：限制对话框最大高度防止超出视口 */
.add-to-playlist-dialog .el-dialog__body {
  padding-top: 8px;
  padding-bottom: 4px;
}
</style>
