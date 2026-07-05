<template>
  <div class="page">
    <div class="header">
      <h1>Оплаты клиентов</h1>

      <button class="btn-primary" @click="openCreate">
        Добавить поступление
      </button>
    </div>

    <Table
      :columns="columns"
      :rows="rows"
      :loading="loading"
      row-key="id"
    >
      <template #cell-project="{ row }">
        {{ row.project_name }}
      </template>

      <template #cell-client="{ row }">
        {{ row.client_name }}
      </template>

      <template #cell-type="{ row }">
        {{ row.type_name }}
      </template>

      <template #cell-date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-amount="{ value }">
        {{ formatMoney(value) }}
      </template>

      <template #actions="{ row }">
        <button @click="remove(row.id)">🗑</button>
      </template>
    </Table>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop" @click.self="close">
      <div class="modal">
        <h2>Добавить оплату</h2>

        <form @submit.prevent="submit">
          <!-- PROJECT ONLY -->
          <select v-model="form.project" required>
            <option value="">Выберите проект</option>
            <option
              v-for="p in projectsStore.projects"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name || `Проект #${p.id}` }}
            </option>
          </select>

          <input type="date" v-model="form.date" required />
          <input v-model="form.amount" placeholder="Сумма" required />

          <button type="submit">
            Сохранить
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Table from '@/components/Table.vue'

import { useProjectsStore } from '@/stores/projects'
import {
  getTransactions,
  createTransaction,
  deleteTransaction
} from '@/services/finance.service'

const projectsStore = useProjectsStore()

const loading = ref(false)
const showModal = ref(false)

const transactions = ref([])

const CLIENT_PAYMENT_TYPE_ID = 1

/**
 * FORM
 * ⚠️ counterparty НЕ вводим, но он обязателен для backend
 */
const form = reactive({
  project: '',
  date: '',
  amount: ''
})

const columns = [
  { key: 'project', label: 'Проект' },
  { key: 'client', label: 'Клиент' },
  { key: 'type', label: 'Тип' },
  { key: 'date', label: 'Дата' },
  { key: 'amount', label: 'Сумма' }
]

/**
 * LOAD
 */
async function load() {
  loading.value = true
  try {
    await projectsStore.initProjectsPage()
    transactions.value = await getTransactions()
  } finally {
    loading.value = false
  }
}

onMounted(load)

/**
 * ROWS
 */
const rows = computed(() => {
  return transactions.value
    .filter(t => t.finance_operation_type === CLIENT_PAYMENT_TYPE_ID)
    .map(t => {
      const project = projectsStore.projects.find(p => p.id === t.project)
      const client = project
        ? projectsStore.clients.find(c => c.id === project.client)
        : null

      return {
        ...t,
        project_name: project?.name || `Проект #${t.project}`,
        client_name: client?.name || '—',
        type_name: 'Client payment'
      }
    })
})

/**
 * ACTIONS
 */
function openCreate() {
  showModal.value = true
}

function close() {
  showModal.value = false
}

async function submit() {
  const project = projectsStore.projects.find(p => p.id === form.project)

  if (!project) return

  await createTransaction({
    project: form.project,
    counterparty: project.client, // 💥 ВАЖНО — ОБЯЗАТЕЛЬНО
    finance_operation_type: CLIENT_PAYMENT_TYPE_ID,
    date: form.date,
    amount: form.amount
  })

  close()
  await load()
}

async function remove(id) {
  await deleteTransaction(id)
  await load()
}

/**
 * FORMAT
 */
function formatMoney(v) {
  return new Intl.NumberFormat('ru-RU').format(Number(v || 0))
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card {
  padding: 16px;
  border-radius: 12px;
  background: var(--surface, #111827);
}

.actions {
  display: flex;
  gap: 8px;
}

.btn,
.btn-secondary,
.btn-danger,
.icon-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
}

.btn {
  background: #2563eb;
  color: #fff;
}

.btn-secondary {
  background: #374151;
  color: #fff;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.icon-btn {
  background: transparent;
  color: inherit;
  padding: 4px 8px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal {
  width: min(820px, 100%);
  padding: 16px;
  border-radius: 12px;
  background: var(--surface, #111827);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.form {
  display: grid;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field input,
.field select {
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid #374151;
  background: #0f172a;
  color: #fff;
  padding: 0 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.error {
  color: #f87171;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>