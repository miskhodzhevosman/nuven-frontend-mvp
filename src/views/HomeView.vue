<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Финансовый дашборд</h1>
      <Button 
        icon="pi pi-refresh" 
        label="Обновить" 
        @click="store.fetchReport()" 
        :loading="store.loading"
        class="p-button-outlined"
      />
    </div>

    <!-- Состояния загрузки/ошибки -->
    <div v-if="store.loading" class="loading-state">
      <ProgressSpinner />
      <span>Загрузка данных...</span>
    </div>

    <div v-else-if="store.error" class="error-state">
      <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #e74c3c;"></i>
      <p>{{ store.error }}</p>
      <Button label="Попробовать снова" @click="store.fetchReport()" />
    </div>

    <template v-else-if="store.report">
      <!-- Виджет метрик -->
      <FinanceMetricsWidget :report="store.report" />
      
      <!-- Виджет графиков и таблиц -->
      <FinanceChartsWidget :report="store.report" />
    </template>

    <div v-else class="empty-state">
      <i class="pi pi-chart-line" style="font-size: 3rem; color: #9AA0A6;"></i>
      <h3>Нет данных</h3>
      <p>Финансовый отчёт пока пуст</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance.store'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import FinanceMetricsWidget from '@/widgets/FinanceMetricsWidget/index.vue'
import FinanceChartsWidget from '@/widgets/FinanceChartsWidget/index.vue'

const store = useFinanceStore()

onMounted(() => {
  store.fetchReport()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #D0D2D5;
  font-size: 1.75rem;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9AA0A6;
}

.loading-state span {
  margin-top: 16px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #D0D2D5;
}

.error-state p {
  margin: 16px 0 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #9AA0A6;
}

.empty-state h3 {
  margin: 16px 0 8px;
  color: #D0D2D5;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }
}
</style>