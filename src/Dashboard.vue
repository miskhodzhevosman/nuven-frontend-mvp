<template>
  <div class="page">
    <button @click="startTour">Начать обучение</button>
    <header class="page-header">
      <div>
        <h1>📊 Дашборд</h1>
        <p class="muted">Общая финансовая сводка по всем проектам</p>
      </div>
      <button 
        class="btn btn-ghost" 
        @click="refreshReport" 
        :disabled="financeStore.loading"
      >
        ⟳ Обновить
      </button>
    </header>

    <div v-if="financeStore.error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ financeStore.error }}</span>
    </div>

    <div v-if="financeStore.loading && !report" class="state">
      Загрузка отчета…
    </div>

    <template v-if="report">
      <!-- Карточки с ключевыми показателями -->
      <section class="kpi-grid" id="kpi-cards">
        <div class="kpi-card" id="revenue-card">
          <span class="kpi-label">Выручка</span>
          <span class="kpi-value gold">{{ formatCurrency(report.revenue) }}</span>
        </div>
        <div class="kpi-card" id="cost-price-card">
          <span class="kpi-label">Себестоимость</span>
          <span class="kpi-value">{{ formatCurrency(report.cogs) }}</span>
        </div>
        <div class="kpi-card" id="gross-profit-card">
          <span class="kpi-label">Валовая прибыль</span>
          <span class="kpi-value" :class="getProfitClass(report.gross_profit)">
            {{ formatCurrency(report.gross_profit) }}
          </span>
        </div>
        <div class="kpi-card" id="net-profit-card">
          <span class="kpi-label">Чистая прибыль</span>
          <span class="kpi-value" :class="getProfitClass(report.net_profit)">
            {{ formatCurrency(report.net_profit) }}
          </span>
        </div>
      </section>

      <!-- Детальный отчет -->
      <section class="report-section">
        <div class="report-grid">
          <!-- Левая колонка: доходы -->
          <div class="report-column">
            <h3>💰 Доходы</h3>
            <div class="report-item">
              <span class="report-label">Выручка (план)</span>
              <span class="report-value gold">{{ formatCurrency(report.revenue) }}</span>
            </div>
            <div class="report-item">
              <span class="report-label">Получено от клиентов</span>
              <span class="report-value positive">{{ formatCurrency(report.cashflow?.client_received || 0) }}</span>
            </div>
            <div class="report-divider"></div>
            <div class="report-item total">
              <span class="report-label">Итого доходов</span>
              <span class="report-value gold">{{ formatCurrency(report.revenue) }}</span>
            </div>
          </div>

          <!-- Средняя колонка: расходы -->
          <div class="report-column">
            <h3>📉 Расходы</h3>
            <div class="report-item">
              <span class="report-label">Себестоимость (COGS)</span>
              <span class="report-value negative">{{ formatCurrency(report.cogs) }}</span>
            </div>
            <div class="report-item">
              <span class="report-label">Проектные расходы</span>
              <span class="report-value negative">{{ formatCurrency(report.project_expenses || 0) }}</span>
            </div>
            <div class="report-item">
              <span class="report-label">Операционные расходы</span>
              <span class="report-value negative">{{ formatCurrency(report.operation_expenses || 0) }}</span>
            </div>
            <div class="report-divider"></div>
            <div class="report-item total">
              <span class="report-label">Итого расходов</span>
              <span class="report-value negative">
                {{ formatCurrency((report.cogs || 0) + (report.project_expenses || 0) + (report.operation_expenses || 0)) }}
              </span>
            </div>
          </div>

          <!-- Правая колонка: итоги -->
          <div class="report-column">
            <h3>📈 Итоги</h3>
            <div class="report-item">
              <span class="report-label">Валовая прибыль</span>
              <span class="report-value" :class="getProfitClass(report.gross_profit)">
                {{ formatCurrency(report.gross_profit) }}
              </span>
            </div>
            <div class="report-item">
              <span class="report-label">Маржинальность</span>
              <span class="report-value gold">{{ formatPercent(report.gross_profit, report.revenue) }}</span>
            </div>
            <div class="report-divider"></div>
            <div class="report-item total">
              <span class="report-label">Чистая прибыль</span>
              <span class="report-value" :class="getProfitClass(report.net_profit)">
                {{ formatCurrency(report.net_profit) }}
              </span>
            </div>
            <div class="report-item">
              <span class="report-label">Рентабельность</span>
              <span class="report-value" :class="getProfitClass(report.net_profit)">
                {{ formatPercent(report.net_profit, report.revenue) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Движение денег -->
      <section class="cashflow-section">
        <h3>💵 Движение денег</h3>
        <div class="cashflow-grid">
          <div class="cashflow-item">
            <span class="cashflow-label">Получено от клиентов</span>
            <span class="cashflow-value positive">{{ formatCurrency(report.cashflow?.client_received || 0) }}</span>
          </div>
          <div class="cashflow-item">
            <span class="cashflow-label">Оплачено фабрикам</span>
            <span class="cashflow-value negative">{{ formatCurrency(report.cashflow?.factory_paid || 0) }}</span>
          </div>
          <div class="cashflow-item total">
            <span class="cashflow-label">Чистый денежный поток</span>
            <span class="cashflow-value" :class="getProfitClass((report.cashflow?.client_received || 0) - (report.cashflow?.factory_paid || 0))">
              {{ formatCurrency((report.cashflow?.client_received || 0) - (report.cashflow?.factory_paid || 0)) }}
            </span>
          </div>
        </div>
      </section>
    </template>

    <div v-else-if="!financeStore.loading" class="state muted">
      Нет данных для отображения
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useFinanceStore } from '@/modules/finance/store'

import { onboarding } from '@/onboardings/DashboardOnboarding'

function startTour() {
    onboarding.drive();
}

const financeStore = useFinanceStore()

// Computed
const report = computed(() => financeStore.report)

// Methods
function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (!isFinite(num)) return '—'
  return num.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

function formatPercent(profit, revenue) {
  if (!revenue || revenue === 0) return '0.00%'
  const percent = (profit / revenue) * 100
  return percent.toFixed(2) + '%'
}

function getProfitClass(value) {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

function refreshReport() {
  financeStore.fetchGlobalReport()
}

// Init
onMounted(() => {
  financeStore.fetchGlobalReport()
})
</script>

<style scoped>
/*
 * ============================================
 * СТИЛИ ДЛЯ ДАШБОРДА (Dashboard.vue)
 * Цветовая схема: #16181C (фон), #C9A86A (золото), #D0D2D5 (текст)
 * ============================================
 */

/* ============================================
   ОСНОВНЫЕ СТИЛИ
   ============================================ */
.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #16181C;
  color: #D0D2D5;
  min-height: 100vh;
}

/* ============================================
   ЗАГОЛОВОК
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(201, 168, 106, 0.15);
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #C9A86A;
}

.page-header .muted {
  color: rgba(208, 210, 213, 0.5);
  font-size: 14px;
  margin: 4px 0 0;
}

/* ============================================
   KPI КАРТОЧКИ
   ============================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #D0D2D5;
  font-variant-numeric: tabular-nums;
}

.kpi-value.gold {
  color: #C9A86A;
}

.kpi-value.positive {
  color: #4ade80;
}

.kpi-value.negative {
  color: #f87171;
}

/* ============================================
   ОТЧЕТ - ТРИ КОЛОНКИ
   ============================================ */
.report-section {
  margin-bottom: 24px;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.report-column {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.report-column h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #C9A86A;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(208, 210, 213, 0.04);
}

.report-item:last-child {
  border-bottom: none;
}

.report-item.total {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 2px solid rgba(201, 168, 106, 0.15);
  border-bottom: none;
}

.report-label {
  font-size: 13px;
  color: rgba(208, 210, 213, 0.7);
}

.report-value {
  font-size: 14px;
  font-weight: 600;
  color: #D0D2D5;
  font-variant-numeric: tabular-nums;
}

.report-value.gold {
  color: #C9A86A;
}

.report-value.positive {
  color: #4ade80;
}

.report-value.negative {
  color: #f87171;
}

.report-divider {
  border: none;
  border-top: 1px solid rgba(208, 210, 213, 0.06);
  margin: 4px 0;
}

/* ============================================
   ДВИЖЕНИЕ ДЕНЕГ
   ============================================ */
.cashflow-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.cashflow-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #C9A86A;
}

.cashflow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.cashflow-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(208, 210, 213, 0.05);
}

.cashflow-item.total {
  background: rgba(201, 168, 106, 0.06);
  border-color: rgba(201, 168, 106, 0.15);
}

.cashflow-label {
  font-size: 13px;
  color: rgba(208, 210, 213, 0.7);
}

.cashflow-value {
  font-size: 16px;
  font-weight: 600;
  color: #D0D2D5;
  font-variant-numeric: tabular-nums;
}

.cashflow-value.positive {
  color: #4ade80;
}

.cashflow-value.negative {
  color: #f87171;
}

/* ============================================
   АЛЕРТЫ / СОСТОЯНИЯ
   ============================================ */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.12);
  color: #f87171;
  border: 1px solid rgba(220, 38, 38, 0.15);
}

.alert-error strong {
  color: #f87171;
}

.state {
  padding: 40px;
  text-align: center;
  color: rgba(208, 210, 213, 0.4);
  font-size: 16px;
}

.muted {
  color: rgba(208, 210, 213, 0.4);
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #D0D2D5;
  border-color: rgba(208, 210, 213, 0.15);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 210, 213, 0.25);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1024px) {
  .report-grid {
    grid-template-columns: 1fr 1fr;
  }

  .report-grid .report-column:last-child {
    grid-column: 1 / -1;
  }

  .cashflow-grid {
    grid-template-columns: 1fr 1fr;
  }

  .cashflow-grid .cashflow-item.total {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-header .btn {
    width: 100%;
    text-align: center;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .kpi-value {
    font-size: 20px;
  }

  .report-grid {
    grid-template-columns: 1fr;
  }

  .report-grid .report-column:last-child {
    grid-column: 1;
  }

  .cashflow-grid {
    grid-template-columns: 1fr;
  }

  .cashflow-grid .cashflow-item.total {
    grid-column: 1;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 12px;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .kpi-card {
    padding: 12px 14px;
  }

  .kpi-value {
    font-size: 18px;
  }

  .report-column {
    padding: 14px;
  }

  .report-item {
    padding: 6px 0;
  }

  .report-label {
    font-size: 12px;
  }

  .report-value {
    font-size: 13px;
  }

  .cashflow-item {
    padding: 10px 12px;
  }

  .cashflow-label {
    font-size: 12px;
  }

  .cashflow-value {
    font-size: 14px;
  }
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.35);
}
</style>