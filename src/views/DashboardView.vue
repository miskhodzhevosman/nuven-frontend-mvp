<template>
  <div class="dashboard">
    <h1>Дашборд</h1>

    <div v-if="store.loading">Загрузка...</div>
    <div v-else-if="store.error">{{ store.error }}</div>

    <template v-else>

      <!-- Плитки -->
      <div class="tiles">
        <div class="tile">
          <div class="label">Выручка</div>
          <div class="value">{{ store.report?.revenue }}</div>
        </div>

        <div class="tile">
          <div class="label">Чистая прибыль</div>
          <div class="value">{{ store.report?.net_profit }}</div>
        </div>

        <div class="tile">
          <div class="label">Дебиторка</div>
          <div class="value">{{ store.report?.cashflow?.client_received }}</div>
        </div>

        <div class="tile">
          <div class="label">Кредиторка</div>
          <div class="value">{{ store.report?.cashflow?.factory_paid }}</div>
        </div>
      </div>

      <!-- Таблица -->
      <Table
        :columns="columns"
        :rows="rows"
        :loading="store.loading"
        row-key="key"
      />

    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Table from '@/components/Table.vue'
import { useFinanceStore } from '@/stores/finance.store'

const store = useFinanceStore()

const columns = [
  { key: 'name', label: 'Показатель' },
  { key: 'value', label: 'Значение' }
]

const rows = computed(() => {
  const r = store.report
  if (!r) return []

  return [
    { key: 'revenue', name: 'Выручка', value: r.revenue },
    { key: 'net_profit', name: 'Чистая прибыль', value: r.net_profit },
    { key: 'gross_profit', name: 'Валовая прибыль', value: r.gross_profit },
    { key: 'cogs', name: 'Себестоимость', value: r.cogs },
    { key: 'operation_expenses', name: 'Операционные расходы', value: r.operation_expenses },
    { key: 'project_expenses', name: 'Проектные расходы', value: r.project_expenses },
    { key: 'client_received', name: 'Дебиторка', value: r.cashflow?.client_received },
    { key: 'factory_paid', name: 'Кредиторка', value: r.cashflow?.factory_paid }
  ]
})

onMounted(() => {
  store.fetchReport()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.tile {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.label {
  font-size: 12px;
  color: #777;
}

.value {
  font-size: 18px;
  font-weight: 600;
  margin-top: 6px;
}
</style>