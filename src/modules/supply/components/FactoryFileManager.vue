<!-- src/modules/supply/components/FactoryFileManager.vue -->
<template>
  <div class="factory-files">
    <div class="files-header">
      <h3 class="files-title">Файлы фабрики</h3>
      <button @click="triggerFileUpload" class="btn btn--primary btn--small">
        <span class="btn-icon">+</span> Добавить файл
      </button>
      <input
        ref="fileInput"
        type="file"
        class="hidden-input"
        @change="handleFileSelect"
        multiple
      />
    </div>

    <div v-if="loading" class="files-loading">
      <div class="spinner"></div>
      Загрузка файлов...
    </div>

    <div v-else-if="files.length === 0" class="files-empty">
      <p>Нет прикрепленных файлов</p>
    </div>

    <div v-else class="files-list">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-item"
      >
        <div class="file-info">
          <div class="file-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" stroke-width="2"/>
              <path d="M14 2v6h6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="file-details">
            <div class="file-name">{{ file.name || file.file_url.split('/').pop() }}</div>
            <div class="file-meta">
              <span class="file-size">{{ file.size_kb || formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.uploaded_at) }}</span>
            </div>
            <div v-if="file.description" class="file-description">
              {{ file.description }}
            </div>
          </div>
        </div>
        <div class="file-actions">
          <a :href="file.file_url" target="_blank" class="btn btn--secondary btn--small">
            Скачать
          </a>
          <button @click="editFile(file)" class="btn btn--secondary btn--small">
            Изменить
          </button>
          <button @click="confirmDelete(file)" class="btn btn--danger btn--small">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования файла -->
    <div v-if="editingFile" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal--small">
        <div class="modal__header">
          <h3 class="modal__title">Редактирование файла</h3>
          <button @click="closeEditModal" class="modal__close-btn">×</button>
        </div>
        <form @submit.prevent="updateFile" class="modal__form">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Название</label>
              <input
                v-model="editForm.name"
                type="text"
                class="form-input"
                placeholder="Введите название файла"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Описание</label>
              <textarea
                v-model="editForm.description"
                class="form-input"
                rows="3"
                placeholder="Введите описание файла"
              ></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" @click="closeEditModal" class="btn btn--secondary">
              Отмена
            </button>
            <button type="submit" class="btn btn--primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'

const props = defineProps({
  factoryId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['file-uploaded', 'file-deleted', 'file-updated'])

const store = useSupplyStore()
const files = ref([])
const loading = ref(false)
const saving = ref(false)
const editingFile = ref(null)
const fileInput = ref(null)

const editForm = ref({
  name: '',
  description: ''
})

// Загрузка файлов
const loadFiles = async () => {
  if (!props.factoryId) return
  
  loading.value = true
  try {
    files.value = await store.fetchFactoryFiles(props.factoryId)
  } catch (error) {
    console.error('Error loading files:', error)
  } finally {
    loading.value = false
  }
}

// Выбор файлов
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// Обработка выбранных файлов
const handleFileSelect = async (event) => {
  const selectedFiles = event.target.files
  if (!selectedFiles.length) return

  loading.value = true
  try {
    for (const file of selectedFiles) {
      await store.uploadFactoryFile(props.factoryId, file)
    }
    await loadFiles()
    emit('file-uploaded', files.value)
  } catch (error) {
    console.error('Error uploading files:', error)
  } finally {
    loading.value = false
    fileInput.value.value = ''
  }
}

// Редактирование файла
const editFile = (file) => {
  editingFile.value = file
  editForm.value = {
    name: file.name || '',
    description: file.description || ''
  }
}

// Обновление файла
const updateFile = async () => {
  if (!editingFile.value) return
  
  saving.value = true
  try {
    await store.updateFactoryFile(editingFile.value.id, editForm.value)
    await loadFiles()
    emit('file-updated', files.value)
    closeEditModal()
  } catch (error) {
    console.error('Error updating file:', error)
  } finally {
    saving.value = false
  }
}

// Закрытие модального окна редактирования
const closeEditModal = () => {
  editingFile.value = null
  editForm.value = { name: '', description: '' }
}

// Удаление файла
const confirmDelete = async (file) => {
  if (!confirm(`Удалить файл "${file.name || file.file_url}"?`)) return
  
  loading.value = true
  try {
    await store.deleteFactoryFile(file.id)
    await loadFiles()
    emit('file-deleted', files.value)
  } catch (error) {
    console.error('Error deleting file:', error)
  } finally {
    loading.value = false
  }
}

// Вспомогательные функции
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Загружаем файлы при монтировании и изменении factoryId
watch(() => props.factoryId, () => {
  loadFiles()
}, { immediate: true })
</script>

<style scoped>
.factory-files {
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.files-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.hidden-input {
  display: none;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn--small {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.btn--primary {
  background: #1890ff;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn--secondary {
  background: #f5f5f5;
  color: #333;
}

.btn--secondary:hover:not(:disabled) {
  background: #e8e8e8;
}

.btn--danger {
  background: #ff4d4f;
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background: #ff7875;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.files-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #999;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.files-empty {
  text-align: center;
  padding: 20px;
  color: #999;
  background: #fafafa;
  border-radius: 4px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.file-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: #1890ff;
  flex-shrink: 0;
  margin-top: 2px;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  word-break: break-word;
}

.file-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.file-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  word-break: break-word;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

/* Модальное окно для редактирования */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s;
}

.modal--small {
  max-width: 400px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal__close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  transition: color 0.3s;
}

.modal__close-btn:hover {
  color: #333;
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

textarea.form-input {
  resize: vertical;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>