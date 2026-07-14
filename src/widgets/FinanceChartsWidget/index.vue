<template>
  <div>
    <!-- Графики -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Структура доходов и расходов</h3>
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>

      <div class="chart-card">
        <h3>Распределение расходов</h3>
        <Chart type="pie" :data="pieData" :options="pieOptions" />
      </div>
    </div>

    <!-- Таблица показателей -->
    <div class="table-card">
      <h3>Финансовые показатели</h3>
      <DataTable 
        :value="rows" 
        dataKey="key"
        class="p-datatable-sm"
        stripedRows
        :rows="10"
        :paginator="true"
      >
        <Column field="name" header="Показатель" style="min-width: 200px">
          <template #body="{ data }">
            <strong>{{ data.name }}</strong>
          </template>
        </Column>
        
        <Column field="value" header="Значение" style="width: 200px">
          <template #body="{ data }">
            <span :class="getValueClass(data.key)">{{ data.value }}</span>
          </template>
        </Column>
        
        <Column field="percentage" header="Доля в выручке" style="width: 150px">
          <template #body="{ data }">
            <span v-if="data.percentage !== null" class="percentage-badge">
              {{ formatPercent(data.percentage) }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
})

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

const rows = computed(() => {
  const r = props.report
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
    { 
      key: 'client_received', 
      name: 'Дебиторская задолженность', 
      value: formatMoney(r.cashflow?.client_received),
      percentage: null 
    },
    { 
      key: 'factory_paid', 
      name: 'Кредиторская задолженность', 
      value: formatMoney(r.cashflow?.factory_paid),
      percentage: null 
    },
  ]
})

const chartData = computed(() => {
  const r = props.report
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

const pieData = computed(() => {
  const r = props.report
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
</script>

<style scoped>
@import './style.css';
</style>