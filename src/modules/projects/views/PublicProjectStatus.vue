<template>
  <div class="public-status-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка статуса заказа...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="retry" class="btn btn-primary">Попробовать снова</button>
    </div>

    <div v-else-if="project" class="status-card">
      <!-- Шапка -->
      <div class="status-header">
        <div class="header-left">
          <div class="project-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h1>{{ project.name }}</h1>
            <p class="client">{{ project.client || 'Клиент не указан' }}</p>
          </div>
        </div>
        <span class="hashid">#{{ project.hashid }}</span>
      </div>

      <!-- Прогресс-бар вертикальный -->
      <div class="progress-section">
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">Текущий статус</span>
            <span class="status-badge" :style="{ backgroundColor: getStatusColor(project.status?.order) }">
              {{ project.status?.name || 'Неизвестно' }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Прогресс</span>
            <span class="progress-text">{{ progressPercentage }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Обновлен</span>
            <span>{{ formatDateReadable(project.updated_at) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Создан</span>
            <span>{{ formatDateReadable(project.created_at) }}</span>
          </div>
        </div>

        <!-- Вертикальная дорожка статусов -->
        <div class="status-timeline">
          <div class="timeline-line">
            <div 
              class="timeline-fill" 
              :style="{ height: progressPercentage + '%' }"
            ></div>
          </div>
          
          <div 
            v-for="(status, index) in allStatuses" 
            :key="status.id"
            class="timeline-item"
            :class="{
              completed: index <= currentStatusIndex,
              active: index === currentStatusIndex,
              pending: index > currentStatusIndex
            }"
          >
            <div class="timeline-dot">
              <span v-if="index < currentStatusIndex" class="checkmark">✓</span>
              <span v-else-if="index === currentStatusIndex" class="dot-number">{{ index + 1 }}</span>
              <span v-else class="dot-number">{{ index + 1 }}</span>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-step">Шаг {{ index + 1 }}</span>
                <span class="timeline-status-name">{{ status.name }}</span>
              </div>
              <div class="timeline-status-indicator">
                <span v-if="index < currentStatusIndex" class="status-done">✓ Завершено</span>
                <span v-else-if="index === currentStatusIndex" class="status-current">● В процессе</span>
                <span v-else class="status-pending">○ Ожидает</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="status-footer">
        <div class="footer-left">
          <span class="live-dot"></span>
          <p class="note">Статус обновляется автоматически</p>
        </div>
        <button @click="refresh" class="btn-refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/>
          </svg>
          Обновить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const project = ref(null)
const allStatuses = ref([])
const loading = ref(true)
const error = ref(null)
let refreshInterval = null

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const currentStatusIndex = computed(() => {
  if (!project.value?.status || !allStatuses.value.length) return 0
  return allStatuses.value.findIndex(s => s.id === project.value.status.id)
})

const progressPercentage = computed(() => {
  if (!allStatuses.value.length) return 0
  const total = allStatuses.value.length - 1
  if (total === 0) return 100
  return Math.round((currentStatusIndex.value / total) * 100)
})

const fetchAllStatuses = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/project-statuses/public/`
    )
    allStatuses.value = response.data || []
    allStatuses.value.sort((a, b) => a.order - b.order)
  } catch (err) {
    console.error('Error fetching statuses:', err)
  }
}

const fetchProjectStatus = async (hashid) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/projects/public/${hashid}/status/`
    )
    project.value = response.data
    await fetchAllStatuses()
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Заказ не найден. Проверьте правильность ссылки.'
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
    1: '#C4965A',
    2: '#D4A86A',
    3: '#E8B86D',
    4: '#C87A3A',
    5: '#A0522D',
    6: '#8B6B4D',
    7: '#6B8E6B',
    8: '#4A7A8B',
    9: '#7A6B8B',
    10: '#8B6B6B',
    11: '#6B8B6B',
    12: '#2E7D32',
  }
  return colors[order] || '#9CA3AF'
}

const formatDateReadable = (dateString) => {
  if (!dateString) return '—'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}

const refresh = () => {
  const hashid = route.params.hashid
  if (hashid) fetchProjectStatus(hashid)
}

const retry = refresh

onMounted(() => {
  const hashid = route.params.hashid
  if (hashid) {
    fetchProjectStatus(hashid)
    refreshInterval = setInterval(() => {
      fetchProjectStatus(hashid)
    }, 30000)
  } else {
    error.value = 'Не указан идентификатор заказа'
    loading.value = false
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

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
* {
  box-sizing: border-box;
}

.public-status-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f0eb;
  padding: 20px;
  font-family: 'Georgia', 'Times New Roman', -apple-system, BlinkMacSystemFont, 'Segoe UI', serif;
  background-image: 
    radial-gradient(ellipse at 20% 50%, rgba(196, 150, 90, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 50%, rgba(139, 107, 77, 0.06) 0%, transparent 60%);
}

.status-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 40px;
  max-width: 720px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(196, 150, 90, 0.15);
  position: relative;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #C4965A, #E8B86D, #C4965A);
  border-radius: 20px 20px 0 0;
}

/* Шапка */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
  margin-bottom: 28px;
  border-bottom: 2px solid #f0ebe6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.project-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f5f0eb, #e8e0d8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C4965A;
  flex-shrink: 0;
  border: 1px solid rgba(196, 150, 90, 0.2);
}

.status-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #3d2c1b;
  letter-spacing: -0.3px;
  font-family: 'Georgia', serif;
}

.client {
  margin: 4px 0 0;
  color: #8b7a6a;
  font-size: 15px;
  font-style: italic;
}

.hashid {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 13px;
  color: #b8a89a;
  background: #f5f0eb;
  padding: 6px 18px;
  border-radius: 100px;
  border: 1px solid rgba(196, 150, 90, 0.1);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* Прогресс */
.progress-section {
  margin-bottom: 32px;
}

.progress-stats {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  background: #faf8f6;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 28px;
  border: 1px solid rgba(196, 150, 90, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #b8a89a;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.stat-item > span:last-child {
  color: #3d2c1b;
  font-size: 15px;
  font-weight: 500;
  font-family: 'Georgia', serif;
}

.status-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 100px;
  color: white;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.3px;
  width: fit-content;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.progress-text {
  font-weight: 700 !important;
  color: #C4965A !important;
  font-size: 18px !important;
}

/* Вертикальный таймлайн */
.status-timeline {
  position: relative;
  padding: 12px 0 8px 40px;
}

.timeline-line {
  position: absolute;
  left: 14px;
  top: 28px;
  bottom: 28px;
  width: 3px;
  background: #f0ebe6;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, #C4965A, #E8B86D);
  border-radius: 4px;
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-item {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  position: relative;
  transition: all 0.3s ease;
}

.timeline-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2.5px solid #e8e0d8;
  background: #faf8f6;
  color: #b8a89a;
  flex-shrink: 0;
  font-family: 'Georgia', serif;
  z-index: 1;
  position: relative;
}

.timeline-item.completed .timeline-dot {
  background: linear-gradient(135deg, #C4965A, #D4A86A);
  border-color: #C4965A;
  color: white;
  box-shadow: 0 4px 16px rgba(196, 150, 90, 0.25);
}

.timeline-item.active .timeline-dot {
  background: linear-gradient(135deg, #D4A86A, #E8B86D);
  border-color: #E8B86D;
  color: white;
  box-shadow: 0 0 0 6px rgba(196, 150, 90, 0.12), 0 4px 20px rgba(196, 150, 90, 0.2);
  transform: scale(1.08);
}

.timeline-item.pending .timeline-dot {
  border-color: #e8e0d8;
  color: #d5cdc5;
}

.checkmark {
  font-size: 14px;
  line-height: 1;
}

.dot-number {
  font-size: 11px;
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-step {
  font-size: 12px;
  font-weight: 500;
  color: #b8a89a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
}

.timeline-status-name {
  font-size: 16px;
  font-weight: 600;
  color: #3d2c1b;
  font-family: 'Georgia', serif;
}

.timeline-item.completed .timeline-status-name {
  color: #8b7a6a;
}

.timeline-item.active .timeline-status-name {
  color: #C4965A;
}

.timeline-status-indicator {
  font-size: 13px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.status-done {
  color: #7CB342;
}

.status-current {
  color: #C4965A;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-pending {
  color: #d5cdc5;
}

/* Футер */
.status-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  margin-top: 8px;
  border-top: 2px solid #f0ebe6;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7CB342;
  display: inline-block;
  animation: pulse-dot 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(124, 179, 66, 0.3);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.note {
  margin: 0;
  color: #b8a89a;
  font-size: 14px;
  font-style: italic;
  font-family: 'Georgia', serif;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #3d2c1b;
  background: #f5f0eb;
  transition: all 0.3s ease;
  border: 1px solid rgba(196, 150, 90, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.btn-refresh:hover {
  background: #f0ebe6;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(196, 150, 90, 0.15);
}

.btn-refresh svg {
  flex-shrink: 0;
  stroke: #C4965A;
}

/* Загрузка и ошибка */
.loading, .error {
  background: #ffffff;
  border-radius: 20px;
  padding: 52px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(196, 150, 90, 0.1);
}

.spinner {
  border: 3px solid #f0ebe6;
  border-top: 3px solid #C4965A;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p, .error p {
  color: #8b7a6a;
  margin: 0 0 24px;
  font-size: 16px;
  font-family: 'Georgia', serif;
}

.error h2 {
  color: #a0522d;
  margin: 0 0 12px;
  font-weight: 700;
  font-family: 'Georgia', serif;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #C4965A, #D4A86A);
  color: white;
  box-shadow: 0 8px 24px rgba(196, 150, 90, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(196, 150, 90, 0.35);
}

/* Адаптив */
@media (max-width: 768px) {
  .status-card {
    padding: 28px 20px;
    border-radius: 16px;
  }

  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 20px;
  }

  .header-left {
    width: 100%;
  }

  .project-icon {
    width: 46px;
    height: 46px;
  }

  .status-header h1 {
    font-size: 22px;
  }

  .hashid {
    align-self: flex-start;
  }

  .progress-stats {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .status-timeline {
    padding-left: 32px;
  }

  .timeline-line {
    left: 10px;
  }

  .timeline-dot {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }

  .timeline-status-name {
    font-size: 14px;
  }

  .timeline-step {
    font-size: 11px;
  }

  .status-footer {
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
  }

  .footer-left {
    justify-content: center;
  }

  .btn-refresh {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .public-status-page {
    padding: 12px;
  }

  .status-card {
    padding: 20px 16px;
    border-radius: 14px;
  }

  .project-icon {
    width: 40px;
    height: 40px;
  }

  .project-icon svg {
    width: 20px;
    height: 20px;
  }

  .status-header h1 {
    font-size: 19px;
  }

  .client {
    font-size: 13px;
  }

  .hashid {
    font-size: 11px;
    padding: 4px 14px;
  }

  .progress-stats {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px;
  }

  .stat-item > span:last-child {
    font-size: 13px;
  }

  .status-badge {
    font-size: 11px;
    padding: 3px 12px;
  }

  .status-timeline {
    padding-left: 24px;
    padding-top: 4px;
  }

  .timeline-line {
    left: 6px;
    top: 20px;
    bottom: 20px;
  }

  .timeline-dot {
    width: 24px;
    height: 24px;
    font-size: 9px;
    border-width: 2px;
  }

  .timeline-item {
    padding: 10px 0;
    gap: 14px;
  }

  .checkmark {
    font-size: 11px;
  }

  .timeline-status-name {
    font-size: 13px;
  }

  .timeline-step {
    font-size: 10px;
  }

  .timeline-status-indicator {
    font-size: 11px;
  }

  .timeline-header {
    gap: 8px;
  }

  .loading, .error {
    padding: 32px 20px;
  }

  .note {
    font-size: 12px;
  }

  .btn-refresh {
    padding: 8px 18px;
    font-size: 13px;
  }
}
</style>