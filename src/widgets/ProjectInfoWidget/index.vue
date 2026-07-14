<template>
  <Card class="info-card">
    <template #title>
      <div class="card-header">
        <h2 class="card-title">Информация о проекте</h2>
      </div>
    </template>
    <template #content>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-item__label">Статус</span>
          <span class="info-item__value">
            <Tag 
              :value="projectInfo?.status_name"
              :severity="getStatusSeverity(projectInfo?.status)"
              :rounded="true"
            />
          </span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Клиент</span>
          <span class="info-item__value">{{ projectInfo?.client_name || '—' }}</span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Менеджер</span>
          <span class="info-item__value">{{ projectInfo?.manager_name || '—' }}</span>
        </div>

        <div class="info-item">
          <span class="info-item__label">География</span>
          <span class="info-item__value">{{ projectInfo?.geography || '—' }}</span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Создан</span>
          <span class="info-item__value">{{ formatDate(projectInfo?.created_at) }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card'
import Tag from 'primevue/tag'

defineProps({
  projectInfo: {
    type: Object,
    default: null
  },
  statuses: {
    type: Array,
    default: () => []
  }
})

const getStatusSeverity = (statusId) => {
  const status = statuses?.find(s => s.id === statusId)
  const name = (status?.name || '').toLowerCase()

  if (name.includes('работ') || name.includes('process') || name.includes('active')) return 'info'
  if (name.includes('заверш') || name.includes('done')) return 'success'
  if (name.includes('нов') || name.includes('draft')) return 'secondary'
  if (name.includes('отмен') || name.includes('cancel')) return 'danger'
  return 'info'
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.info-card {
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item__label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item__value {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}
</style>