<template>
  <div class="tiles">
    <div class="tile">
      <div class="tile__icon">💰</div>
      <div class="tile__content">
        <div class="tile__label">Выручка</div>
        <div class="tile__value">{{ formatMoney(report.revenue) }}</div>
      </div>
    </div>

    <div class="tile">
      <div class="tile__icon">📈</div>
      <div class="tile__content">
        <div class="tile__label">Чистая прибыль</div>
        <div class="tile__value">{{ formatMoney(report.net_profit) }}</div>
      </div>
    </div>

    <div class="tile tile--warning">
      <div class="tile__icon">📋</div>
      <div class="tile__content">
        <div class="tile__label">Дебиторская задолженность</div>
        <div class="tile__value">{{ formatMoney(accountsReceivable) }}</div>
      </div>
    </div>

    <div class="tile tile--danger">
      <div class="tile__icon">🏦</div>
      <div class="tile__content">
        <div class="tile__label">Кредиторская задолженность</div>
        <div class="tile__value">{{ formatMoney(accountsPayable) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
})

// Дебиторка = начисленная выручка - реально полученные деньги
const accountsReceivable = computed(() => {
  const revenue = Number(props.report.revenue) || 0
  const received = Number(props.report.cashflow?.client_received) || 0
  return revenue - received
})

// Кредиторка = начисленная себестоимость - реально оплаченные деньги поставщикам
const accountsPayable = computed(() => {
  const cogs = Number(props.report.cogs) || 0
  const paid = Number(props.report.cashflow?.factory_paid) || 0
  return cogs - paid
})

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  // Если значение отрицательное, показываем со знаком минус
  const absNum = Math.abs(num)
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absNum)

  return num < 0 ? `-${formatted}` : formatted
}
</script>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.tile {
  background: #1E2026;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #2D3038;
  transition: all 0.2s;
}

.tile:hover {
  border-color: #4A4D57;
}

.tile__icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2D3038;
  border-radius: 10px;
}

.tile__content {
  flex: 1;
}

.tile__label {
  font-size: 0.875rem;
  color: #9AA0A6;
  margin-bottom: 4px;
}

.tile__value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #D0D2D5;
}

.tile--warning .tile__value {
  color: #FFB74D;
}

.tile--danger .tile__value {
  color: #EF5350;
}

@media (max-width: 1024px) {
  .tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .tiles {
    grid-template-columns: 1fr;
  }
}
</style>