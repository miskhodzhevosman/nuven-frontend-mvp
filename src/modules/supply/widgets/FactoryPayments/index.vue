<!-- modules/app/widgets/FactoryPayments/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Оплаты фабрикам</h2>
    </div>

    <div v-if="!payments.length" class="state muted">Нет оплат.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th class="num">Сумма</th>
            <th>Контрагент</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.id">
            <td>{{ formatDate(p.date) }}</td>
            <td class="num">{{ formatAmount(p.amount) }}</td>
            <td>{{ p.counterparty ?? '—' }}</td>
            <td>{{ p.comment || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const store = useProjectsStore()
const { factoryPayments } = storeToRefs(store)

// Computed
const payments = computed(() => factoryPayments.value || [])

// Methods
function formatDate(d) { 
  return d ? d.slice(0, 10) : '—' 
}

function formatAmount(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : String(v)
}
</script>

<style scoped>
/* Копируем стили из основного файла для карточки */
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

.state.muted {
  color: rgba(208, 210, 213, 0.4);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #D0D2D5;
  min-width: 400px;
}

.table th,
.table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(208, 210, 213, 0.06);
  white-space: nowrap;
}

.table th {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 600;
  color: rgba(208, 210, 213, 0.7);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .card {
    padding: 14px;
  }

  .table {
    font-size: 12px;
    min-width: 300px;
  }

  .table th,
  .table td {
    padding: 6px 10px;
    font-size: 12px;
  }

  .table th {
    font-size: 10px;
  }
}
</style>