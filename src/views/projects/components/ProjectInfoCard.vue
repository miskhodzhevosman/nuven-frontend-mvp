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
              :value="projectInfo.status_name"
              :severity="getStatusSeverity(projectInfo.status)"
              :rounded="true"
            />
          </span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Клиент</span>
          <span class="info-item__value">{{ projectInfo.client_name || '—' }}</span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Менеджер</span>
          <span class="info-item__value">{{ projectInfo.manager_name || '—' }}</span>
        </div>

        <div class="info-item">
          <span class="info-item__label">География</span>
          <span class="info-item__value">
            {{ projectInfo.full_location_name || '—' }}
          </span>
        </div>

        <div class="info-item">
          <span class="info-item__label">Создан</span>
          <span class="info-item__value">{{ formatDate(projectInfo.created_at) }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { defineProps } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const props = defineProps({
  projectInfo: Object,
  getStatusSeverity: Function,
  formatDate: Function
})
</script>

<style scoped>
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
  color: #666;
  font-weight: 500;
}

.info-item__value {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}
</style>