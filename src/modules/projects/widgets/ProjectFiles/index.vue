<template>
  <div class="project-files">
    <div class="files-header">
      <div>
        <h2>Файлы проекта</h2>
        <p class="files-count">
          {{ files.length }}
          {{ files.length === 1 ? 'файл' : 'файлов' }}
        </p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="uploading"
        @click="openFilePicker"
      >
        {{ uploading ? 'Загрузка…' : '+ Загрузить файл' }}
      </button>

      <input
        ref="fileInput"
        type="file"
        class="hidden-input"
        @change="onFileSelected"
      />
    </div>

    <!-- Ошибка -->
    <div v-if="localError" class="alert alert-error">
      <strong>Ошибка:</strong>
      <span>{{ localError }}</span>
    </div>

    <!-- Загрузка списка -->
    <div v-if="loadingFiles" class="state">
      Загрузка файлов…
    </div>

    <!-- Нет файлов -->
    <div
      v-else-if="!files.length"
      class="empty-files"
    >
      <div class="empty-icon">📁</div>

      <h3>Файлов пока нет</h3>

      <p>
        Загрузите документы, связанные с этим проектом.
      </p>

      <button
        class="btn btn-primary"
        @click="openFilePicker"
      >
        Загрузить первый файл
      </button>
    </div>

    <!-- Список файлов -->
    <div v-else class="files-list">
      <div
        v-for="item in files"
        :key="item.id"
        class="file-row"
      >
        <div class="file-icon">
          📄
        </div>

        <div class="file-info">
          <a
            :href="item.file"
            target="_blank"
            rel="noopener noreferrer"
            class="file-name"
          >
            {{ displayName(item) }}
          </a>

          <div class="file-meta">
            <span>
              {{ uploadedBy(item) }}
            </span>

            <span>•</span>

            <span>
              {{ formatDate(item.uploaded_at) }}
            </span>
          </div>

          <div
            v-if="item.description"
            class="file-description"
          >
            {{ item.description }}
          </div>
        </div>

        <div class="file-actions">
          <a
            :href="item.file"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost btn-small"
          >
            Открыть
          </a>

          <button
            class="btn btn-danger btn-small"
            :disabled="deletingId === item.id"
            @click="deleteFile(item)"
          >
            {{
              deletingId === item.id
                ? 'Удаление…'
                : 'Удалить'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../../store'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const store = useProjectsStore()

const {
  projectFiles,
} = storeToRefs(store)

const fileInput = ref(null)

const loadingFiles = ref(false)
const uploading = ref(false)
const deletingId = ref(null)
const localError = ref(null)

const files = computed(() => projectFiles.value || [])

function openFilePicker() {
  fileInput.value?.click()
}

async function loadFiles() {
  if (!props.projectId) {
    return
  }

  loadingFiles.value = true
  localError.value = null

  try {
    await store.fetchProjectFiles(props.projectId)
  } catch (error) {
    console.error('Failed to load project files:', error)

    localError.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Не удалось загрузить файлы'
  } finally {
    loadingFiles.value = false
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]

  // Сбрасываем input, чтобы можно было
  // повторно выбрать тот же файл
  event.target.value = ''

  if (!file) {
    return
  }

  uploading.value = true
  localError.value = null

  try {
    await store.uploadProjectFile(
      props.projectId,
      file,
      file.name,
      ''
    )
  } catch (error) {
    console.error('Failed to upload project file:', error)

    localError.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Не удалось загрузить файл'
  } finally {
    uploading.value = false
  }
}

async function deleteFile(item) {
  const confirmed = window.confirm(
    `Удалить файл "${displayName(item)}"?`
  )

  if (!confirmed) {
    return
  }

  deletingId.value = item.id
  localError.value = null

  try {
    await store.deleteProjectFile(
      props.projectId,
      item.id
    )
  } catch (error) {
    console.error('Failed to delete project file:', error)

    localError.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Не удалось удалить файл'
  } finally {
    deletingId.value = null
  }
}

function displayName(item) {
  if (item.name) {
    return item.name
  }

  if (item.file) {
    return item.file.split('/').pop()
  }

  return `Файл #${item.id}`
}

function uploadedBy(item) {
  if (!item.uploaded_by) {
    return 'Неизвестный пользователь'
  }

  if (typeof item.uploaded_by === 'string') {
    return item.uploaded_by
  }

  if (typeof item.uploaded_by === 'object') {
    const user = item.uploaded_by

    return (
      user.full_name ||
      user.username ||
      [user.first_name, user.last_name]
        .filter(Boolean)
        .join(' ') ||
      `Пользователь #${user.id}`
    )
  }

  return `Пользователь #${item.uploaded_by}`
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

watch(
  () => props.projectId,
  () => {
    loadFiles()
  }
)

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.project-files {
  width: 100%;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.files-header h2 {
  margin: 0;
}

.files-count {
  margin: 4px 0 0;
  opacity: 0.65;
}

.hidden-input {
  display: none;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  background: var(--card-bg, #fff);
}

.file-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;
  background: #f3f4f6;
  font-size: 22px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name:hover {
  text-decoration: underline;
}

.file-meta {
  display: flex;
  gap: 8px;
  margin-top: 5px;
  font-size: 13px;
  opacity: 0.65;
}

.file-description {
  margin-top: 7px;
  font-size: 14px;
  opacity: 0.8;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 10px;
  font-size: 13px;
}

.empty-files {
  padding: 70px 20px;
  text-align: center;
  border: 1px dashed var(--border-color, #d1d5db);
  border-radius: 12px;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 10px;
}

.empty-files h3 {
  margin: 0 0 8px;
}

.empty-files p {
  margin: 0 0 20px;
  opacity: 0.65;
}

@media (max-width: 700px) {
  .files-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-row {
    align-items: flex-start;
  }

  .file-actions {
    flex-direction: column;
  }
}
</style>