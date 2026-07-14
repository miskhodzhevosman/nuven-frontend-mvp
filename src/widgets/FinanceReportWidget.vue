<template>
  <div class="finance-widget">
    <!-- Заголовок виджета -->
    <div class="widget-header">
      <div class="widget-title">
        <i class="pi pi-chart-line"></i>
        <h3>Финансовый отчет</h3>
      </div>
      <Button 
        icon="pi pi-refresh" 
        @click="fetchReport" 
        :loading="loading"
        size="small"
        text
        rounded
      />
    </div>

    <!-- Состояния загрузки/ошибки -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner style="width: 32px; height: 32px" />
      <span>Загрузка...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <Button label="Повторить" @click="fetchReport" size="small" />
    </div>

    <template v-else-if="report">
      <!-- Компактные плитки -->
      <div class="tiles-grid">
        <div class="tile">
          <div class="tile-icon revenue">💰</div>
          <div class="tile-content">
            <div class="tile-label">Выручка</div>
            <div class="tile-value">{{ formatMoney(report.revenue) }}</div>
          </div>
        </div>

        <div class="tile">
          <div class="tile-icon profit">📈</div>
          <div class="tile-content">
            <div class="tile-label">Чистая прибыль</div>
            <div class="tile-value" :class="getProfitClass(report.net_profit)">
              {{ formatMoney(report.net_profit) }}
            </div>
          </div>
        </div>

        <div class="tile">
          <div class="tile-icon warning">📋</div>
          <div class="tile-content">
            <div class="tile-label">Дебиторская задолженность</div>
            <div class="tile-value">{{ formatMoney(report.cashflow?.client_received) }}</div>
          </div>
        </div>

        <div class="tile">
          <div class="tile-icon danger">🏦</div>
          <div class="tile-content">
            <div class="tile-label">Кредиторская задолженность</div>
            <div class="tile-value">{{ formatMoney(report.cashflow?.factory_paid) }}</div>
          </div>
        </div>
      </div>

      <!-- Графики -->
      <div class="charts-grid">
        <div class="chart-card">
          <h4>Структура доходов и расходов</h4>
          <Chart type="bar" :data="chartData" :options="chartOptions" />
        </div>

        <div class="chart-card">
          <h4>Распределение расходов</h4>
          <Chart type="pie" :data="pieData" :options="pieOptions" />
        </div>
      </div>

      <!-- Краткая таблица -->
      <div class="table-card">
        <DataTable 
          :value="rows" 
          size="small"
          stripedRows
          class="p-datatable-sm"
        >
          <Column field="name" header="Показатель" />
          <Column field="value" header="Значение" style="text-align: right">
            <template #body="{ data }">
              <span :class="getValueClass(data.key)">{{ data.value }}</span>
            </template>
          </Column>
          <Column field="percentage" header="Доля в выручке" style="text-align: right">
            <template #body="{ data }">
              <span v-if="data.percentage !== null" class="percentage-badge">
                {{ formatPercent(data.percentage) }}
              </span>
              <span v-else class="text-muted">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <div v-else class="empty-state">
      <i class="pi pi-chart-line"></i>
      <p>Нет данных для отображения</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import ProgressSpinner from 'primevue/progressspinner'

// Props для настройки виджета
const props = defineProps({
  // Функция для получения данных отчета
  fetchReportData: {
    type: Function,
    required: true
  },
  // Автоматическое обновление (в секундах)
  autoRefreshInterval: {
    type: Number,
    default: 0
  }
})

// Состояние
const loading = ref(false)
const error = ref(null)
const report = ref(null)

/**
 * Загрузка данных отчета
 */
const fetchReport = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await props.fetchReportData()
    report.value = data
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки данных'
    console.error('Finance Widget Error:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Форматирование денег
 */
function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Форматирование денег со знаком
 */
function formatMoneyWithSign(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(num))

  return num < 0 ? `-${formatted}` : formatted
}

/**
 * Форматирование процентов
 */
function formatPercent(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100)
}

/**
 * Получить класс для значения прибыли
 */
function getProfitClass(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return num >= 0 ? 'text-positive' : 'text-negative'
}

/**
 * Получить класс для значения в таблице
 */
function getValueClass(key) {
  const positiveKeys = ['revenue', 'net_profit', 'gross_profit']
  const negativeKeys = ['cogs', 'operation_expenses', 'project_expenses']
  
  if (positiveKeys.includes(key)) {
    return 'text-positive'
  } else if (negativeKeys.includes(key)) {
    return 'text-negative'
  }
  return ''
}

/**
 * Данные для таблицы
 */
const rows = computed(() => {
  const r = report.value
  if (!r) return []

  const revenue = Number(r.revenue) || 0
  
  return [
    { 
      key: 'revenue', 
      name: 'Выручка', 
      value: formatMoney(r.revenue),
      percentage: null 
    },
    { 
      key: 'net_profit', 
      name: 'Чистая прибыль', 
      value: formatMoney(r.net_profit),
      percentage: revenue ? (Number(r.net_profit) / revenue * 100) : null 
    },
    { 
      key: 'gross_profit', 
      name: 'Валовая прибыль', 
      value: formatMoney(r.gross_profit),
      percentage: revenue ? (Number(r.gross_profit) / revenue * 100) : null 
    },
    { 
      key: 'cogs', 
      name: 'Себестоимость', 
      value: formatMoney(r.cogs),
      percentage: revenue ? (Number(r.cogs) / revenue * 100) : null 
    },
    { 
      key: 'operation_expenses', 
      name: 'Операционные расходы', 
      value: formatMoney(r.operation_expenses),
      percentage: revenue ? (Number(r.operation_expenses) / revenue * 100) : null 
    },
    { 
      key: 'project_expenses', 
      name: 'Проектные расходы', 
      value: formatMoney(r.project_expenses),
      percentage: revenue ? (Number(r.project_expenses) / revenue * 100) : null 
    },
  ]
})

/**
 * Данные для столбчатой диаграммы
 */
const chartData = computed(() => {
  const r = report.value
  if (!r) return { labels: [], datasets: [] }

  return {
    labels: ['Выручка', 'Себестоимость', 'Валовая прибыль', 'Операционные расходы', 'Проектные расходы', 'Чистая прибыль'],
    datasets: [
      {
        label: 'Сумма',
        data: [
          Number(r.revenue) || 0,
          Number(r.cogs) || 0,
          Number(r.gross_profit) || 0,
          Number(r.operation_expenses) || 0,
          Number(r.project_expenses) || 0,
          Number(r.net_profit) || 0
        ],
        backgroundColor: [
          '#4CAF50',
          '#FF9800',
          '#2196F3',
          '#F44336',
          '#9C27B0',
          '#00BCD4'
        ],
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatMoney(value)
        }
      }
    }
  }
}

/**
 * Данные для круговой диаграммы
 */
const pieData = computed(() => {
  const r = report.value
  if (!r) return { labels: [], datasets: [] }

  const expenses = [
    { label: 'Себестоимость', value: Number(r.cogs) || 0 },
    { label: 'Операционные расходы', value: Number(r.operation_expenses) || 0 },
    { label: 'Проектные расходы', value: Number(r.project_expenses) || 0 }
  ]

  const total = expenses.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return {
      labels: ['Нет данных'],
      datasets: [{ data: [1], backgroundColor: ['#9AA0A6'] }]
    }
  }

  return {
    labels: expenses.map(item => item.label),
    datasets: [
      {
        data: expenses.map(item => item.value),
        backgroundColor: ['#FF9800', '#F44336', '#9C27B0'],
        borderWidth: 2,
        borderColor: '#16181C'
      }
    ]
  }
})

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#D0D2D5',
        padding: 20
      }
    }
  }
}

// Автообновление
let refreshTimer = null

if (props.autoRefreshInterval > 0) {
  refreshTimer = setInterval(fetchReport, props.autoRefreshInterval * 1000)
}

// Загрузка данных при монтировании
onMounted(() => {
  fetchReport()
})

// Очистка таймера при размонтировании
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.finance-widget {
  background: #1E2128;
  border-radius: 12px;
  padding: 1.25rem;
  color: #D0D2D5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

/* Заголовок */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget-title i {
  font-size: 1.25rem;
  color: #4CAF50;
}

.widget-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #FFFFFF;
}

/* Состояния загрузки/ошибки */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  gap: 0.75rem;
}

.loading-state span {
  color: #9AA0A6;
  font-size: 0.875rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  gap: 0.75rem;
}

.error-state i {
  font-size: 2rem;
  color: #e74c3c;
}

.error-state p {
  margin: 0;
  color: #D0D2D5;
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  gap: 0.5rem;
  color: #9AA0A6;
}

.empty-state i {
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Плитки */
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.tile {
  background: #282C35;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background 0.2s;
}

.tile:hover {
  background: #323741;
}

.tile-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.tile-icon.revenue {
  background: rgba(76, 175, 80, 0.15);
}

.tile-icon.profit {
  background: rgba(33, 150, 243, 0.15);
}

.tile-icon.warning {
  background: rgba(255, 152, 0, 0.15);
}

.tile-icon.danger {
  background: rgba(244, 67, 54, 0.15);
}

.tile-content {
  flex: 1;
  min-width: 0;
}

.tile-label {
  font-size: 0.75rem;
  color: #9AA0A6;
  margin-bottom: 0.125rem;
}

.tile-value {
  font-size: 1rem;
  font-weight: 600;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Графики */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.chart-card {
  background: #282C35;
  border-radius: 8px;
  padding: 1rem;
}

.chart-card h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #D0D2D5;
}

.chart-card :deep(.p-chart) {
  height: 160px;
}

/* Таблица */
.table-card {
  background: #282C35;
  border-radius: 8px;
  padding: 0.5rem;
}

.table-card :deep(.p-datatable) {
  font-size: 0.813rem;
}

.table-card :deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 0.5rem 0.75rem;
}

.table-card :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: transparent;
  color: #9AA0A6;
  border: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-card :deep(.p-datatable .p-datatable-tbody > tr) {
  background: transparent;
}

.table-card :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border: none;
  padding: 0.5rem 0.75rem;
  color: #D0D2D5;
}

.table-card :deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

.table-card :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(255, 255, 255, 0.04);
}

.text-positive {
  color: #4CAF50;
}

.text-negative {
  color: #F44336;
}

.text-muted {
  color: #9AA0A6;
}

.percentage-badge {
  background: rgba(255, 255, 255, 0.06);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #9AA0A6;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .tiles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .tiles-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .tiles-grid {
    grid-template-columns: 1fr;
  }
  
  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>