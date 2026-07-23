<!-- modules/finance/widgets/ProjectReport/index.vue -->
<template>
  <section class="report-card">
    <h2>📊 Финансовый отчет</h2>
    <div v-if="loading" class="state muted">Загрузка…</div>
    <div v-else-if="reportData" class="report-grid">
      <div class="report-item">
        <span class="report-label">Себестоимость</span>
        <span class="report-value">{{ formatCurrency(reportData.cogs) }}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Валовая прибыль</span>
        <span class="report-value" :class="getProfitClass(reportData.grossProfit)">
          {{ formatCurrency(reportData.grossProfit) }}
        </span>
      </div>
      <div class="report-item">
        <span class="report-label">Маржа</span>
        <span class="report-value gold">{{ formatPercent(reportData.margin) }}</span>
      </div>
      <hr class="report-divider" />
      <div class="report-item">
        <span class="report-label">Получено от клиента</span>
        <span class="report-value positive">{{ formatCurrency(reportData.clientReceived) }}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Дебиторская задолженность</span>
        <span class="report-value">{{ formatCurrency(reportData.accountsReceivable) }}</span>
      </div>
      <hr class="report-divider" />
      <div class="report-item">
        <span class="report-label">Оплачено фабрикам</span>
        <span class="report-value negative">{{ formatCurrency(reportData.factoryPaid) }}</span>
      </div>
      <div class="report-item">
        <span class="report-label">Кредиторская задолженность</span>
        <span class="report-value">{{ formatCurrency(reportData.accountsPayable) }}</span>
      </div>
      <hr class="report-divider" />
      <div class="report-item">
        <span class="report-label">Расходы</span>
        <span class="report-value negative">{{ formatCurrency(reportData.projectExpenses) }}</span>
      </div>
      <div class="report-item total">
        <span class="report-label">Чистая прибыль</span>
        <span class="report-value" :class="getProfitClass(reportData.netProfit)">
          {{ formatCurrency(reportData.netProfit) }}
        </span>
      </div>
    </div>
    <div v-else class="state muted">Нет данных</div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useFinanceStore } from '../../store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const store = useFinanceStore()
const { report, loading } = storeToRefs(store)

// Локальное состояние для данных отчета
const reportData = ref(null)

// Функция загрузки отчета
async function loadReport() {
  if (!props.projectId) return
  try {
    await store.fetchProjectReport(props.projectId)
  } catch (e) {
    console.error('Failed to load project report:', e)
  }
}

// Вычисляем данные из store
function computeReportData() {
  if (!report.value) {
    reportData.value = null
    return
  }
  
  const r = report.value
  
  const plannedCogs = r.planned?.cogs || 0
  const plannedGrossProfit = r.planned?.gross_profit || 0
  const plannedMargin = r.planned?.margin || 0
  
  const factClientReceived = r.fact?.client_received || 0
  const factFactoryPaid = r.fact?.factory_paid || 0
  const factProjectExpenses = r.fact?.project_expenses || 0
  
  const accountsReceivable = r.cashflow?.accounts_receivable || 0
  const accountsPayable = r.cashflow?.accounts_payable || 0
  
  const netProfit = r.net_profit || 0
  
  reportData.value = {
    cogs: plannedCogs,
    grossProfit: plannedGrossProfit,
    margin: plannedMargin,
    clientReceived: factClientReceived,
    accountsReceivable: accountsReceivable,
    factoryPaid: factFactoryPaid,
    accountsPayable: accountsPayable,
    projectExpenses: factProjectExpenses,
    netProfit: netProfit,
  }
}

// Следим за изменением report в store
watch(report, () => {
  computeReportData()
}, { immediate: true, deep: true })

// Следим за изменением projectId
watch(() => props.projectId, () => {
  loadReport()
}, { immediate: true })

// Загружаем при монтировании
onMounted(() => {
  loadReport()
})

// Helpers
function formatCurrency(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : String(v)
}

function formatPercent(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) + '%' : String(v)
}

function getProfitClass(value) {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}
</script>

<style scoped>
/* ============================================
   ТЕМНЫЕ СТИЛИ ДЛЯ ProjectReport
   ============================================ */

.report-card {
  background: rgba(201, 168, 106, 0.06);
  border: 1px solid rgba(201, 168, 106, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.report-card h2 {
  color: #C9A86A;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

.state.muted {
  color: rgba(208, 210, 213, 0.4);
}

.report-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(208, 210, 213, 0.06);
  transition: background 0.2s;
}

.report-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.report-item.total {
  background: rgba(201, 168, 106, 0.1);
  border-color: rgba(201, 168, 106, 0.3);
  margin-top: 4px;
}

.report-label {
  font-size: 13px;
  color: rgba(208, 210, 213, 0.7);
  font-weight: 400;
}

.report-value {
  font-size: 14px;
  font-weight: 600;
  color: #D0D2D5;
  font-variant-numeric: tabular-nums;
}

.report-value.positive {
  color: #4ade80;
}

.report-value.negative {
  color: #f87171;
}

.report-value.gold {
  color: #C9A86A;
}

.report-divider {
  border: none;
  border-top: 1px solid rgba(201, 168, 106, 0.15);
  margin: 8px 0;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .report-card {
    padding: 14px;
  }

  .report-item {
    padding: 8px 10px;
    font-size: 13px;
  }

  .report-label {
    font-size: 12px;
  }

  .report-value {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .report-item {
    padding: 6px 10px;
    font-size: 12px;
  }

  .report-label {
    font-size: 11px;
  }

  .report-value {
    font-size: 12px;
  }
}
</style>