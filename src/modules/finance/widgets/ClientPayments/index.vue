<!-- modules/finance/widgets/ClientPayments/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Оплаты клиентов</h2>
      <button 
        id="add-client-payment-btn"
        class="btn btn-primary" 
        @click="openCreatePayment"
        :disabled="!projectClient"
      >
        + Добавить оплату
      </button>
    </div>

    <div v-if="!projectClient" class="state warning">
      ⚠️ У проекта не указан клиент. Оплаты недоступны.
    </div>
    <div v-else-if="loading" class="state muted">Загрузка...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!payments.length" class="state muted">Нет оплат.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th class="num">Сумма</th>
            <th>Клиент</th>
            <th>Комментарий</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.id">
            <td>{{ formatDate(p.date) }}</td>
            <td class="num">{{ formatAmount(p.amount) }}</td>
            <td>{{ clientName }}</td>
            <td>{{ p.comment || '—' }}</td>
            <td>
              <button class="btn-icon" @click="openEditPayment(p)" title="Редактировать">✏️</button>
              <button class="btn-icon danger" @click="deletePayment(p.id)" title="Удалить">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка -->
    <ClientPaymentFormModal
      v-model="showModal"
      :project-id="projectId"
      :editing-id="editingId"
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
import ClientPaymentFormModal from '@/modules/finance/widgets/components/ClientPaymentFormModal.vue'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const financeStore = useFinanceStore()
const projectsStore = useProjectsStore()
const { clientPayments, loading, error } = storeToRefs(financeStore)
const { currentProject, clients } = storeToRefs(projectsStore)

// State
const showModal = ref(false)
const editingId = ref(null)

// Computed
const payments = computed(() => {
  return (clientPayments.value || []).filter(p => 
    p.project === props.projectId || p.project?.id === props.projectId
  )
})

// Клиент проекта
const projectClient = computed(() => {
  if (currentProject.value?.client) {
    if (typeof currentProject.value.client === 'object') {
      return currentProject.value.client
    }
    return clients.value?.find(c => c.id === currentProject.value.client)
  }
  return null
})

const clientName = computed(() => {
  return projectClient.value?.name || '—'
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

function openCreatePayment() {
  if (!projectClient.value) {
    alert('У проекта не указан клиент. Добавьте клиента в проект.')
    return
  }
  editingId.value = null
  showModal.value = true
}

function openEditPayment(payment) {
  editingId.value = payment.id
  showModal.value = true
}

async function deletePayment(id) {
  if (!confirm('Удалить оплату клиента?')) return
  try {
    await financeStore.deleteClientPayment(id)
    await financeStore.fetchClientPayments({ project_id: props.projectId })
    emit('refresh')
  } catch (e) {
    console.error('Failed to delete payment:', e)
  }
}

function handleCreated() {
  financeStore.fetchClientPayments({ project_id: props.projectId })
  emit('refresh')
}

function handleUpdated() {
  financeStore.fetchClientPayments({ project_id: props.projectId })
  emit('refresh')
}

function handleClosed() {
  editingId.value = null
}

// Загружаем данные
onMounted(async () => {
  await projectsStore.fetchProject(props.projectId)
  await financeStore.fetchClientPayments({ project_id: props.projectId })
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await projectsStore.fetchProject(newId)
    await financeStore.fetchClientPayments({ project_id: newId })
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

.state.warning {
  color: #fbbf24;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #C9A86A;
  color: #16181C;
}

.btn-primary:hover:not(:disabled) {
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