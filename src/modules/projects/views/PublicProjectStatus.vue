<template>
  <div class="public-status-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка статуса проекта...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="retry" class="btn btn-primary">Попробовать снова</button>
    </div>

    <div v-else-if="project" class="status-card">
      <div class="status-header">
        <h1>{{ project.name }}</h1>
        <span class="hashid">ID: {{ project.hashid }}</span>
      </div>

      <div class="status-body">
        <div class="status-row">
          <span class="label">Текущий статус:</span>
          <span class="status-badge" :style="{ backgroundColor: getStatusColor(project.status?.order) }">
            {{ project.status?.name || 'Неизвестно' }}
          </span>
        </div>

        <div class="status-row">
          <span class="label">Клиент:</span>
          <span>{{ project.client || 'Не указан' }}</span>
        </div>

        <div class="status-row">
          <span class="label">Создан:</span>
          <span>{{ formatDate(project.created_at) }}</span>
        </div>

        <div class="status-row">
          <span class="label">Последнее обновление:</span>
          <span>{{ formatDate(project.updated_at) }}</span>
        </div>
      </div>

      <div class="status-footer">
        <p class="note">Статус обновляется автоматически</p>
        <button @click="refresh" class="btn btn-ghost btn-sm">🔄 Обновить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const project = ref(null)
const loading = ref(true)
const error = ref(null)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const fetchProjectStatus = async (hashid) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/projects/public/${hashid}/status/`
    )
    project.value = response.data
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Проект не найден. Проверьте правильность ссылки.'
    } else {
      error.value = 'Ошибка загрузки статуса. Попробуйте позже.'
    }
    console.error('Error fetching project status:', err)
  } finally {
    loading.value = false
  }
}

const getStatusColor = (order) => {
  const colors = {
    1: '#4CAF50',  // начальный
    2: '#FFC107',  // в работе
    3: '#FF9800',  // задержка
    4: '#F44336',  // критический
    5: '#2196F3',  // завершен
  }
  return colors[order] || '#9E9E9E'
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refresh = () => {
  const hashid = route.params.hashid
  if (hashid) fetchProjectStatus(hashid)
}

const retry = refresh

// При монтировании - получаем hashid из URL
onMounted(() => {
  const hashid = route.params.hashid
  if (hashid) {
    fetchProjectStatus(hashid)
  } else {
    error.value = 'Не указан идентификатор проекта'
    loading.value = false
  }
})

// Если hashid меняется в URL
watch(
  () => route.params.hashid,
  (newHashid) => {
    if (newHashid) {
      fetchProjectStatus(newHashid)
    }
  }
)
</script>

<style scoped>
.public-status-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.status-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.hashid {
  font-family: monospace;
  font-size: 14px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-body {
  margin-bottom: 24px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.status-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.status-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 2px solid #f0f0f0;
}

.note {
  margin: 0;
  color: #999;
  font-size: 13px;
}

.loading, .error {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error h2 {
  color: #d32f2f;
  margin: 0 0 12px;
}

.error p {
  color: #666;
  margin: 0 0 20px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-ghost {
  background: transparent;
  color: #667eea;
}

.btn-ghost:hover {
  background: #f5f5f5;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}
</style>