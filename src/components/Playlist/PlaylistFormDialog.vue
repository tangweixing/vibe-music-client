<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { PlaylistAddDTO, PlaylistUpdateDTO } from '@/api/interface'
import { useMyPlaylistsStore } from '@/stores/modules/myPlaylists'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  mode: 'create' | 'edit'
  // 编辑模式时传入初始值
  initialData?: Partial<PlaylistUpdateDTO & { coverUrl?: string }>
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])
const store = useMyPlaylistsStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

// 表单
const form = ref<PlaylistAddDTO & { playlistId?: number; coverFile?: File }>({
  title: '',
  isPublic: true,
  style: '',
  introduction: '',
})
const coverPreview = ref<string | null>(null)
const loading = ref(false)

watch(() => props.mode, (m) => {
  if (m === 'create') {
    form.value = { title: '', isPublic: true, style: '', introduction: '' }
    coverPreview.value = null
  }
})

watch(() => props.initialData, (data) => {
  if (props.mode === 'edit' && data) {
    form.value = {
      title: data.title || '',
      isPublic: data.isPublic ?? true,
      style: data.style || '',
      introduction: data.introduction || '',
      playlistId: data.playlistId,
    }
    coverPreview.value = data.coverUrl || null
  }
}, { immediate: true })

const handleCoverChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    form.value.coverFile = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入歌单标题')
    return
  }
  loading.value = true
  let ok = false
  if (props.mode === 'create') {
    ok = await store.create(form.value)
  } else if (props.mode === 'edit' && form.value.playlistId) {
    ok = await store.edit({
      playlistId: form.value.playlistId,
      title: form.value.title,
      style: form.value.style,
      introduction: form.value.introduction,
      isPublic: form.value.isPublic,
      coverFile: form.value.coverFile,
    })
  }
  loading.value = false
  if (ok) {
    emit('success')
    visible.value = false
  }
}
</script>

<template>
  <el-dialog :model-value="visible" @close="visible = false" :title="mode === 'create' ? '创建歌单' : '编辑歌单'" width="480px">
    <div class="space-y-4">
      <el-form label-width="90px">
        <el-form-item label="歌单封面">
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">
              <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
              <span v-else class="text-xs text-gray-400">无封面</span>
            </div>
            <el-button size="small" @click="$refs.coverInput.click()">选择图片</el-button>
            <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="handleCoverChange" />
          </div>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入歌单标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="公开"> 
          <el-switch v-model="form.isPublic" />
        </el-form-item>
        <el-form-item label="风格">
          <el-input v-model="form.style" placeholder="如：流行 / 摇滚" maxlength="50" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.introduction" type="textarea" :rows="4" placeholder="歌单简介 (可选)" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">{{ mode === 'create' ? '创建' : '保存' }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
