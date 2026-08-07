<!-- modules/projects/pages/ProjectStatusesPage.vue -->
<template>
  <div class="project-statuses-page">
    <div class="page-header">
      <h1 class="page-title">Статусы проекта</h1>
      <div class="project-info" v-if="currentProject">
        <span class="project-name">{{ currentProject.name }}</span>
        <span class="project-id">#{{ currentProject.id }}</span>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка статусов...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadData" class="retry-btn">Повторить</button>
    </div>

    <!-- Статусы -->
    <div v-else class="statuses-container">
      <div 
        v-for="status in sortedStatuses" 
        :key="status.id"
        class="status-item"
        :class="{
          'is-current': isCurrentStatus(status.id),
          'is-past': isPastStatus(status.order),
          'is-future': isFutureStatus(status.order)
        }"
      >
        <div class="status-connector">
          <div class="status-line"></div>
          <div class="status-dot">
            <span v-if="isCurrentStatus(status.id)" class="current-indicator">●</span>
            <span v-else-if="isPastStatus(status.order)" class="past-indicator">✓</span>
            <span v-else class="future-indicator">○</span>
          </div>
        </div>

        <div class="status-content" :class="{ 'current-status': isCurrentStatus(status.id) }">
          <div class="status-header">
            <span class="status-order">#{{ status.order }}</span>
            <span class="status-name">{{ status.name }}</span>
            <span v-if="isCurrentStatus(status.id)" class="current-badge">Текущий</span>
          </div>
          
          <div class="status-actions" v-if="canChangeStatus">
            <button 
              v-if="!isCurrentStatus(status.id)" 
              @click="changeStatus(status.id)"
              class="btn-change-status"
              :disabled="changingStatus"
            >
              {{ changingStatus && pendingStatusId === status.id ? 'Изменение...' : 'Установить' }}
            </button>
          </div>

          <div class="status-meta">
            <span class="status-date" v-if="statusHistory[status.id]">
              Установлен: {{ formatDate(statusHistory[status.id]) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Информация о текущем статусе -->
    <div v-if="currentStatus" class="current-status-info">
      <h3>Текущий статус</h3>
      <div class="info-card">
        <span class="info-label">Статус:</span>
        <span class="info-value">{{ currentStatus.name }}</span>
        <span class="info-label">Порядковый номер:</span>
        <span class="info-value">#{{ currentStatus.order }}</span>
      </div>
    </div>

    <!-- Статистика -->
    <div class="status-stats">
      <div class="stat-item">
        <span class="stat-label">Всего статусов:</span>
        <span class="stat-value">{{ sortedStatuses.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Текущий статус:</span>
        <span class="stat-value" v-if="currentStatus">{{ currentStatus.name }}</span>
        <span class="stat-value" v-else>Не установлен</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Прогресс:</span>
        <span class="stat-value">{{ progressPercentage }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/modules/projects/store'
import { projectsApi } from '@/modules/projects/api'

export default {
  name: 'ProjectStatusesPage',
  
  setup() {
    const route = useRoute()
    const store = useProjectsStore()

    // Состояние
    const loading = ref(false)
    const error = ref(null)
    const changingStatus = ref(false)
    const pendingStatusId = ref(null)
    const statusHistory = ref({})
    const projectStatuses = ref([])
    const currentProject = ref(null)

    // Вычисляемые свойства
    const projectId = computed(() => parseInt(route.params.id))
    
    const currentStatus = computed(() => {
      if (!currentProject.value) return null
      const statusId = currentProject.value.status?.id || currentProject.value.status
      if (!statusId) return null
      return projectStatuses.value.find(s => s.id === statusId) || null
    })

    const sortedStatuses = computed(() => {
      return [...projectStatuses.value].sort((a, b) => a.order - b.order)
    })

    const progressPercentage = computed(() => {
      if (!currentProject.value || projectStatuses.value.length === 0) return 0
      
      // Получаем ID статуса
      const statusId = currentProject.value.status?.id || currentProject.value.status
      const currentStatusObj = projectStatuses.value.find(s => s.id === statusId)
      
      if (!currentStatusObj) return 0
      
      const currentOrder = currentStatusObj.order || 0
      const maxOrder = Math.max(...projectStatuses.value.map(s => s.order))
      
      return maxOrder > 0 ? Math.round((currentOrder / maxOrder) * 100) : 0
    })

    const canChangeStatus = computed(() => {
      // Можно добавить проверку прав пользователя
      return true
    })

    // Методы
    const isCurrentStatus = (statusId) => {
      if (!currentProject.value) return false
      const projectStatusId = currentProject.value.status?.id || currentProject.value.status
      return projectStatusId === statusId
    }

    const isPastStatus = (order) => {
      if (!currentProject.value) return false
      
      const statusId = currentProject.value.status?.id || currentProject.value.status
      const currentStatusObj = projectStatuses.value.find(s => s.id === statusId)
      
      if (!currentStatusObj) return false
      
      const currentOrder = currentStatusObj.order || 0
      return order < currentOrder
    }

    const isFutureStatus = (order) => {
      if (!currentProject.value) return false
      
      const statusId = currentProject.value.status?.id || currentProject.value.status
      const currentStatusObj = projectStatuses.value.find(s => s.id === statusId)
      
      if (!currentStatusObj) return false
      
      const currentOrder = currentStatusObj.order || 0
      return order > currentOrder
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '—'
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const loadData = async () => {
      loading.value = true
      error.value = null
      
      try {
        // Загружаем проект
        const project = await store.fetchProject(projectId.value)
        currentProject.value = project
        console.log('📋 Загружен проект:', project)
        console.log('📋 Статус проекта:', project.status)

        // Загружаем все статусы
        const statuses = await projectsApi.getProjectStatuses()
        projectStatuses.value = Array.isArray(statuses) ? statuses : []
        console.log('📋 Загружены статусы:', projectStatuses.value)

        // Загружаем историю статусов
        try {
          const statusId = project.status?.id || project.status
          if (statusId) {
            const history = await projectsApi.getStatusHistory(statusId)
            console.log('📋 История статусов:', history)
            
            if (history && history.results) {
              statusHistory.value = history.results.reduce((acc, item) => {
                acc[item.status] = item.created_at
                return acc
              }, {})
            }
          }
        } catch (historyError) {
          console.warn('Не удалось загрузить историю статусов:', historyError)
          // Продолжаем работу даже без истории
        }

        // Находим текущий статус и добавляем order
        const statusId = project.status?.id || project.status
        const currentStatusObj = projectStatuses.value.find(s => s.id === statusId)
        if (currentStatusObj) {
          currentProject.value.status_order = currentStatusObj.order
          currentProject.value.status_name = currentStatusObj.name
        }

      } catch (e) {
        error.value = e.message || 'Ошибка загрузки данных'
        console.error('Error loading project statuses:', e)
      } finally {
        loading.value = false
      }
    }

    const changeStatus = async (statusId) => {
      if (!confirm('Вы уверены, что хотите изменить статус проекта?')) return

      changingStatus.value = true
      pendingStatusId.value = statusId

      try {
        await store.updateProject(projectId.value, { status: statusId })
        await loadData() // Перезагружаем данные
      } catch (e) {
        error.value = e.message || 'Ошибка изменения статуса'
        console.error('Error changing status:', e)
      } finally {
        changingStatus.value = false
        pendingStatusId.value = null
      }
    }

    // Жизненный цикл
    onMounted(() => {
      loadData()
    })

    // Возвращаем данные
    return {
      loading,
      error,
      changingStatus,
      pendingStatusId,
      currentProject,
      projectStatuses,
      sortedStatuses,
      currentStatus,
      progressPercentage,
      statusHistory,
      isCurrentStatus,
      isPastStatus,
      isFutureStatus,
      formatDate,
      loadData,
      changeStatus
    }
  }
}
</script>

<style scoped>
.project-statuses-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7fafc;
  padding: 8px 16px;
  border-radius: 8px;
}

.project-name {
  font-weight: 500;
  color: #2d3748;
}

.project-id {
  color: #718096;
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #718096;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #feb2b2;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 24px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #3182ce;
}

/* Статусы */
.statuses-container {
  margin-bottom: 32px;
}

.status-item {
  display: flex;
  align-items: stretch;
  margin-bottom: 8px;
  position: relative;
}

.status-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  position: relative;
}

.status-line {
  flex: 1;
  width: 2px;
  background: #e2e8f0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 19px;
  z-index: 1;
}

.status-item:first-child .status-line {
  top: 50%;
}

.status-item:last-child .status-line {
  bottom: 50%;
}

.status-item.is-past .status-line {
  background: #48bb78;
}

.status-item.is-current .status-line {
  background: #4299e1;
}

.status-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  position: relative;
  z-index: 2;
  background: white;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.status-item.is-past .status-dot {
  border-color: #48bb78;
  background: #f0fff4;
}

.status-item.is-current .status-dot {
  border-color: #4299e1;
  background: #ebf8ff;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2);
}

.status-item.is-future .status-dot {
  border-color: #e2e8f0;
  background: white;
}

.current-indicator {
  color: #4299e1;
  font-size: 20px;
}

.past-indicator {
  color: #48bb78;
  font-size: 16px;
}

.future-indicator {
  color: #a0aec0;
  font-size: 16px;
}

.status-content {
  flex: 1;
  padding: 12px 16px;
  margin-left: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item.is-current .status-content {
  background: #ebf8ff;
  border-color: #4299e1;
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.15);
}

.status-item.is-past .status-content {
  background: #f7fafc;
  border-color: #c6f6d5;
  opacity: 0.7;
}

.status-item.is-future .status-content {
  opacity: 0.6;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-order {
  font-size: 12px;
  font-weight: 600;
  color: #a0aec0;
  background: #f7fafc;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-name {
  font-size: 16px;
  font-weight: 500;
  color: #2d3748;
}

.status-item.is-current .status-name {
  color: #2b6cb0;
  font-weight: 600;
}

.current-badge {
  background: #4299e1;
  color: white;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-actions {
  margin-top: 4px;
}

.btn-change-status {
  padding: 4px 16px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-status:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-1px);
}

.btn-change-status:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-meta {
  margin-top: 4px;
}

.status-date {
  font-size: 12px;
  color: #a0aec0;
}

/* Информация о текущем статусе */
.current-status-info {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
}

.current-status-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
}

.info-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
}

.info-label {
  color: #718096;
  font-size: 14px;
}

.info-value {
  color: #2d3748;
  font-weight: 500;
}

/* Статистика */
.status-stats {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f7fafc;
}

.stat-item:last-of-type {
  border-bottom: none;
}

.stat-label {
  color: #718096;
  font-size: 14px;
}

.stat-value {
  color: #2d3748;
  font-weight: 500;
}

.progress-bar {
  margin-top: 12px;
  height: 8px;
  background: #f7fafc;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #4299e1);
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* Адаптивность */
@media (max-width: 768px) {
  .project-statuses-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .status-item {
    margin-bottom: 4px;
  }

  .status-connector {
    width: 30px;
  }

  .status-dot {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .status-line {
    left: 14px;
  }

  .status-content {
    padding: 10px 12px;
    margin-left: 8px;
  }

  .status-name {
    font-size: 14px;
  }

  .info-card {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>