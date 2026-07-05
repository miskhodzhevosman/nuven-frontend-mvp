<template>
  <div class="page">
    <div class="header">
      <h1>Оплаты фабрикам</h1>

      <button class="btn-primary" @click="openCreate">
        Добавить оплату
      </button>
    </div>

    <!-- FILTER -->
    <div class="filters">
      <input
        v-model="projectSearch"
        placeholder="Поиск проекта..."
        class="search-input"
      />

      <div v-if="projectSearch && filteredProjects.length" class="dropdown">
        <div
          v-for="p in filteredProjects"
          :key="p.id"
          class="dropdown-item"
          @click="selectProject(p)"
        >
          {{ p.name || `Проект #${p.id}` }}
        </div>
      </div>

      <div v-if="selectedProjectId" class="selected-filter">
        Фильтр: {{ selectedProjectName }}
        <button @click="clearFilter">✕</button>
      </div>
    </div>

    <!-- TABLE -->
    <Table
      :columns="columns"
      :rows="rows"
      :loading="loading"
      row-key="id"
    >
      <template #cell-project="{ row }">
        {{ row.project_name }}
      </template>

      <template #cell-factory="{ row }">
        {{ row.factory_name }}
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
        <h2>Добавить оплату фабрике</h2>

        <form @submit.prevent="submit">
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

          <button type="submit">Сохранить</button>
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

/**
 * FILTER STATE
 */
const projectSearch = ref('')
const selectedProjectId = ref(null)

/**
 * TYPES
 */
const FACTORY_PAYMENT_TYPE_ID = 2

/**
 * FORM
 */
const form = reactive({
  project: '',
  date: '',
  amount: ''
})

/**
 * COLUMNS
 */
const columns = [
  { key: 'project', label: 'Проект' },
  { key: 'factory', label: 'Фабрика' },
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
 * PROJECT SEARCH
 */
const filteredProjects = computed(() => {
  if (!projectSearch.value) return []

  const q = projectSearch.value.toLowerCase()

  return projectsStore.projects.filter(p =>
    (p.name || '').toLowerCase().includes(q)
  )
})

function selectProject(project) {
  selectedProjectId.value = project.id
  projectSearch.value = project.name
}

function clearFilter() {
  selectedProjectId.value = null
  projectSearch.value = ''
}

const selectedProjectName = computed(() => {
  const p = projectsStore.projects.find(
    x => x.id === selectedProjectId.value
  )
  return p?.name || ''
})

/**
 * ROWS
 */
const rows = computed(() => {
  return transactions.value
    .filter(t => t.finance_operation_type === FACTORY_PAYMENT_TYPE_ID)
    .filter(t => {
      if (!selectedProjectId.value) return true
      return t.project === selectedProjectId.value
    })
    .map(t => {
      const project = projectsStore.projects.find(p => p.id === t.project)

      /**
       * фабрика пока берётся напрямую из counterparty
       * (если у тебя другая логика — скажешь, подстрою)
       */
      const factory = projectsStore.clients.find(c => c.id === t.counterparty)

      return {
        ...t,
        project_name: project?.name || `Проект #${t.project}`,
        factory_name: factory?.name || `Фабрика #${t.counterparty}`,
        type_name: 'Factory payment'
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
    counterparty: project.client, // ⚠️ если фабрика другая сущность — заменим
    finance_operation_type: FACTORY_PAYMENT_TYPE_ID,
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
  background: #0E0F12;
  color: #D0D2D5;
}

/* HEADER */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: #16181C;
  border-radius: 12px;
}

h1 {
  color: #C9A86A;
  margin: 0;
}

/* FILTERS */
.filters {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #16181C;
  border-radius: 12px;
}

.search-input {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 0 12px;
  outline: none;
}

.search-input:focus {
  border-color: #C9A86A;
}

.dropdown {
  position: absolute;
  top: 70px;
  left: 16px;
  right: 16px;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 10px;
  overflow: hidden;
  z-index: 10;
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #0E0F12;
}

.selected-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 10px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
}

/* BUTTONS */
.btn-primary,
.btn,
.btn-secondary,
.btn-danger,
.icon-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: 0.15s ease;
}

.btn-primary,
.btn {
  background: #C9A86A;
  color: #0E0F12;
}

.btn-primary:hover,
.btn:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: #2A2D33;
  color: #D0D2D5;
}

.btn-secondary:hover {
  background: #343842;
}

.btn-danger {
  background: #7A2E2E;
  color: #D0D2D5;
}

.btn-danger:hover {
  background: #922F2F;
}

.icon-btn {
  background: transparent;
  color: #D0D2D5;
  padding: 6px 8px;
}

.icon-btn:hover {
  color: #C9A86A;
}

/* TABLE */
table {
  width: 100%;
  border-collapse: collapse;
  background: #16181C;
  border-radius: 12px;
  overflow: hidden;
}

th,
td {
  padding: 10px;
  border-bottom: 1px solid #2A2D33;
  color: #D0D2D5;
}

th {
  color: #C9A86A;
  text-align: left;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal {
  width: min(820px, 100%);
  padding: 16px;
  border-radius: 12px;
  background: #16181C;
  border: 1px solid #2A2D33;
}

.modal h2 {
  color: #C9A86A;
  margin-bottom: 12px;
}

form {
  display: grid;
  gap: 12px;
}

input,
select {
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 0 12px;
  outline: none;
}

input:focus,
select:focus {
  border-color: #C9A86A;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>