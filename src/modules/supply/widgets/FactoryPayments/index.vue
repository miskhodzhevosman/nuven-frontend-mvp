<!-- modules/finance/widgets/FactoryPayments/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Оплаты фабрикам</h2>
      <button 
        id="add-factory-payment-btn"
        class="btn btn-primary" 
        @click="openCreatePayment"
      >
        + Добавить оплату
      </button>
    </div>

    <div v-if="loading" class="state muted">Загрузка...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!payments.length" class="state muted">Нет оплат.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th class="num">Сумма</th>
            <th>Контрагент</th>
            <th>Комментарий</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.id">
            <td>{{ formatDate(p.date) }}</td>
            <td class="num">{{ formatAmount(p.amount) }}</td>
            <td>{{ getFactoryName(p) }}</td>
            <td>{{ p.comment || '—' }}</td>
            <td>
              <button class="btn-icon" @click="openEditPayment(p)" title="Редактировать">✎</button>
              <button class="btn-icon danger" @click="deletePayment(p.id)" title="Удалить">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка для создания/редактирования -->
    <FactoryPaymentModal
      v-model="showModal"
      :project-id="projectId"
      :editing-payment="selectedPayment"
      @created="handleCreated"
      @updated="handleUpdated"
      @closed="handleClosed"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFinanceStore } from '@/modules/finance/store'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'
import FactoryPaymentModal from '@/modules/supply/widgets/FactoryPaymentModal/index.vue'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const financeStore = useFinanceStore()
const projectsStore = useProjectsStore()
const { factoryPayments, loading, error } = storeToRefs(financeStore)
const { factories } = storeToRefs(projectsStore)

// State
const showModal = ref(false)
const selectedPayment = ref(null)

// Computed
const payments = computed(() => {
  return (factoryPayments.value || []).filter(p => 
    p.project === props.projectId || p.project?.id === props.projectId
  )
})

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

function getFactoryName(payment) {
  // Если в объекте уже есть название
  if (payment.counterparty_name) return payment.counterparty_name
  if (payment.counterparty?.name) return payment.counterparty.name
  
  // Если есть ID - ищем в списке фабрик
  const factoryId = payment.counterparty || payment.counterparty_id
  if (factoryId) {
    const factory = factories.value?.find(f => f.id === Number(factoryId))
    if (factory) return factory.name
  }
  
  return '—'
}

function openCreatePayment() {
  selectedPayment.value = null
  showModal.value = true
}

function openEditPayment(payment) {
  selectedPayment.value = payment
  showModal.value = true
}

async function deletePayment(id) {
  if (!confirm('Удалить оплату фабрике?')) return
  try {
    await financeStore.deleteFactoryPayment(id)
    await financeStore.fetchFactoryPayments({ project_id: props.projectId })
    emit('refresh')
  } catch (e) {
    console.error('Failed to delete payment:', e)
  }
}

function handleCreated() {
  financeStore.fetchFactoryPayments({ project_id: props.projectId })
  emit('refresh')
}

function handleUpdated() {
  financeStore.fetchFactoryPayments({ project_id: props.projectId })
  emit('refresh')
}

function handleClosed() {
  selectedPayment.value = null
}

// Загружаем данные
onMounted(async () => {
  await projectsStore.fetchFactories()
  await financeStore.fetchFactoryPayments({ project_id: props.projectId })
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await projectsStore.fetchFactories()
    await financeStore.fetchFactoryPayments({ project_id: newId })
  }
})
</script>

<style scoped>
.card {
  background: #1e2126;
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
  margin: 0;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

.state.error {
  color: #ef4444;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 8px 12px;
  color: rgba(208, 210, 213, 0.5);
  font-weight: 500;
  border-bottom: 1px solid rgba(208, 210, 213, 0.1);
}

.table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(208, 210, 213, 0.05);
  color: #D0D2D5;
}

.table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #C9A86A;
  color: #16181C;
}

.btn-primary:hover {
  background: #d4b87a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 106, 0.3);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: rgba(208, 210, 213, 0.5);
  transition: color 0.2s;
  font-size: 14px;
}

.btn-icon:hover {
  color: #C9A86A;
}

.btn-icon.danger:hover {
  color: #ef4444;
}
</style>