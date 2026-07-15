<template>
  <Card class="finance-card">
    <template #title>
      <h2 class="card-title">Финансы</h2>
    </template>
    <template #content>
      <div class="finance-blocks">

        <!-- PLAN -->
        <div class="finance-block">
          <h3>План</h3>
          <div class="finance-row">
            <span>Выручка</span>
            <strong class="text-positive">{{ formatMoney(planned?.revenue ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>COGS</span>
            <strong class="text-negative">{{ formatMoney(planned?.cogs ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Валовая прибыль</span>
            <strong>{{ formatMoney(planned?.gross_profit ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Маржа</span>
            <strong>
              <Tag 
                :value="`${planned?.margin ?? 0}%`"
                :severity="getMarginSeverity(planned?.margin)"
                :rounded="true"
                size="small"
              />
            </strong>
          </div>
        </div>

        <!-- FACT -->
        <div class="finance-block">
          <h3>Факт</h3>
          <div class="finance-row">
            <span>Оплата от клиента</span>
            <strong class="text-positive">{{ formatMoney(fact?.client_received ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Оплаты фабрикам</span>
            <strong class="text-negative">{{ formatMoney(fact?.factory_paid ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Проектные расходы</span>
            <strong class="text-negative">{{ formatMoney(fact?.project_expenses ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Операционные расходы</span>
            <strong class="text-negative">{{ formatMoney(fact?.operation_expenses ?? 0) }}</strong>
          </div>
        </div>

        <!-- CASHFLOW -->
        <div class="finance-block">
          <h3>Cashflow</h3>
          <div class="finance-row">
            <span>Дебиторка</span>
            <strong>{{ formatMoney(cashflow?.accounts_receivable ?? 0) }}</strong>
          </div>
          <div class="finance-row">
            <span>Кредиторка</span>
            <strong>{{ formatMoney(cashflow?.accounts_payable ?? 0) }}</strong>
          </div>
        </div>

      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card'
import Tag from 'primevue/tag'

defineProps({
  planned: Object,
  fact: Object,
  cashflow: Object,
  formatMoney: Function,
  getMarginSeverity: Function
})
</script>

<style scoped>
.finance-blocks {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.finance-block h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  font-size: 0.95rem;
}

.finance-row span {
  color: #555;
}

.finance-row strong {
  font-weight: 600;
}
</style>