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
   СВЕТЛЫЕ СТИЛИ ДЛЯ ProjectReport
   Цветовая схема: #F8F9FA (фон), #2C3E50 (акцент), #1A1A1A (текст)
   ============================================ */

.report-card {
  background: rgba(44, 62, 80, 0.04);
  border: 1px solid rgba(44, 62, 80, 0.12);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.report-card h2 {
  color: #2C3E50;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(26, 26, 26, 0.4);
}

.state.muted {
  color: rgba(26, 26, 26, 0.3);
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
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.report-item:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

.report-item.total {
  background: rgba(44, 62, 80, 0.06);
  border-color: rgba(44, 62, 80, 0.15);
  margin-top: 4px;
}

.report-label {
  font-size: 13px;
  color: rgba(26, 26, 26, 0.6);
  font-weight: 400;
}

.report-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  font-variant-numeric: tabular-nums;
}

.report-value.positive {
  color: #16A34A;
}

.report-value.negative {
  color: #DC2626;
}

.report-value.gold {
  color: #2C3E50;
}

.report-divider {
  border: none;
  border-top: 1px solid rgba(44, 62, 80, 0.1);
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