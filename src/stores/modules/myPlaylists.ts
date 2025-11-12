import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import coverImg from '@/assets/cover.png'
import {
  createPlaylist,
  updatePlaylist,
  updatePlaylistCover,
  deletePlaylist as apiDeletePlaylist,
  getAllPlaylistsInfo,
} from '@/api/system'
import type { PlaylistAddDTO, PlaylistUpdateDTO, SimplePlaylistItem } from '@/api/interface'

interface State {
  loading: boolean
  myPlaylists: SimplePlaylistItem[]
}

export const useMyPlaylistsStore = defineStore('myPlaylists', {
  state: (): State => ({
    loading: false,
    myPlaylists: [],
  }),
  actions: {
    // 拉取我创建的歌单（后端若支持按照登录用户过滤，可在 DTO 中透传）
    async fetchMyPlaylists(params: Record<string, any> = { pageNum: 1, pageSize: 50 }) {
      try {
        this.loading = true
        const res = await getAllPlaylistsInfo(params)
        if (res.code === 0 && res.data?.items) {
          this.myPlaylists = res.data.items.map((it: any) => ({
            id: it.playlistId ?? it.id,
            title: it.title ?? it.name,
            coverUrl: it.coverUrl ?? coverImg,
          }))
        }
      } catch {
        // 静默失败，避免影响侧边栏
      } finally {
        this.loading = false
      }
    },

    async create(payload: PlaylistAddDTO & { coverFile?: File }) {
      try {
        const { coverFile, ...data } = payload
        const res = await createPlaylist(data)
        if (res.code === 0) {
          // 后端 data 可能是新增的 id 或完整对象
          const newId = typeof res.data === 'number' ? res.data : (res.data as any)?.playlistId || (res.data as any)?.id
          let coverUrl = coverImg
          if (coverFile && newId) {
            const fd = new FormData()
            fd.append('cover', coverFile)
            const coverRes = await updatePlaylistCover(newId, fd)
            if (coverRes.code === 0 && typeof coverRes.data === 'string') {
              coverUrl = coverRes.data
            }
          }
          // 更新本地列表
          this.myPlaylists.unshift({ id: newId, title: data.title, coverUrl })
          ElMessage.success('创建歌单成功')
          return true
        }
        ElMessage.error(res.message || '创建歌单失败')
        return false
      } catch (e: any) {
        ElMessage.error(e?.message || '创建歌单失败')
        return false
      }
    },

    async edit(payload: PlaylistUpdateDTO & { coverFile?: File }) {
      try {
        const { coverFile, ...data } = payload
        const res = await updatePlaylist(data)
        if (res.code === 0) {
          // 覆盖信息
          const idx = this.myPlaylists.findIndex(p => p.id === data.playlistId)
          if (idx !== -1) {
            this.myPlaylists[idx].title = data.title
          }
          if (coverFile) {
            const fd = new FormData()
            fd.append('cover', coverFile)
            const coverRes = await updatePlaylistCover(data.playlistId, fd)
            if (coverRes.code === 0 && typeof coverRes.data === 'string' && idx !== -1) {
              this.myPlaylists[idx].coverUrl = coverRes.data
            }
          }
          ElMessage.success('更新歌单成功')
          return true
        }
        ElMessage.error(res.message || '更新歌单失败')
        return false
      } catch (e: any) {
        ElMessage.error(e?.message || '更新歌单失败')
        return false
      }
    },

    async delete(playlistId: number) {
      try {
        const res = await apiDeletePlaylist(playlistId)
        if (res.code === 0) {
          this.myPlaylists = this.myPlaylists.filter(p => p.id !== playlistId)
          ElMessage.success('删除歌单成功')
          return true
        }
        ElMessage.error(res.message || '删除歌单失败')
        return false
      } catch (e: any) {
        ElMessage.error(e?.message || '删除歌单失败')
        return false
      }
    },
  },
})
