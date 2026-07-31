<!-- modules/supply/widgets/FileUploader/index.vue -->

<template>
  <div class="file-uploader">
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
      <input
        type="file"
        ref="fileInput"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="!uploading" class="upload-placeholder">
        <div class="upload-icon">📄</div>
        <p>Перетащите файлы сюда или <a href="#" @click.prevent="triggerFileInput">выберите файлы</a></p>
        <small>Максимальный размер: 10 MB</small>
      </div>
      
      <div v-else class="upload-loading">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>
    </div>
    
    <!-- Список файлов -->
    <div v-if="files.length > 0" class="files-list">
      <div
        v-for="file in files"
        :key="file.tempId || file.id"
        class="file-item"
      >
        <div class="file-icon">📎</div>
        
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatSize(file.size) }}</span>
            <span class="file-date">{{ formatDate(file.uploaded_at) }}</span>
          </div>
          <div v-if="file.description" class="file-description">
            {{ file.description }}
          </div>
        </div>
        
        <div class="file-actions">
          <a v-if="file.file_url" :href="file.file_url" target="_blank" class="btn-icon" title="Скачать">⬇</a>
          <button class="btn-icon danger" title="Удалить" @click="removeFile(file)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'

const props = defineProps({
  nomenclatureId: {
    type: Number,
    default: null
  },
  files: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:files', 'file-added', 'file-removed'])

const projectsStore = useProjectsStore()
const fileInput = ref(null)
const uploading = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  await uploadFiles(files)
  event.target.value = '' // Reset input
}

async function handleDrop(event) {
  const files = Array.from(event.dataTransfer.files)
  await uploadFiles(files)
}

async function uploadFiles(files) {
  // Если нет ID - сохраняем файлы локально
  if (!props.nomenclatureId) {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds 10MB limit`)
        continue
      }
      
      const newFile = {
        file: file, // Сохраняем сам файл для последующей загрузки
        name: file.name,
        size: file.size,
        description: '',
        tempId: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      }
      
      emit('file-added', newFile)
    }
    return
  }
  
  // Если ID есть - загружаем на сервер
  uploading.value = true
  
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds 10MB limit`)
        continue
      }
      
      const uploaded = await projectsStore.uploadNomenclatureFile(
        props.nomenclatureId,
        file,
        file.name,
        ''
      )
      
      emit('file-added', uploaded)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}

async function removeFile(file) {
  if (!confirm(`Удалить файл "${file.name}"?`)) return
  
  // Если это временный файл (нет ID)
  if (!file.id) {
    emit('file-removed', file)
    return
  }
  
  try {
    await projectsStore.deleteNomenclatureFile(file.id)
    emit('file-removed', file)
  } catch (error) {
    console.error('Failed to delete file:', error)
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.file-uploader {
  margin: 16px 0;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #2196F3;
  background: #f0f8ff;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-placeholder p {
  margin: 8px 0;
  color: #666;
}

.upload-placeholder a {
  color: #2196F3;
  text-decoration: none;
}

.upload-placeholder a:hover {
  text-decoration: underline;
}

.upload-placeholder small {
  color: #999;
}

.files-list {
  margin-top: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fff;
  transition: all 0.2s;
}

.file-item:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.file-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn-icon.danger:hover {
  background: #f44336;
  color: #fff;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>