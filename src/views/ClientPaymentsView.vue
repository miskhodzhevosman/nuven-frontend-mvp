<template>
  <div class="page">
    <div class="page-head">
      <h1>Поступления оплат от клиентов</h1>
      <button class="btn" @click="openCreateModal">
        Добавить поступление
      </button>
    </div>

    <div class="card">
      <h2>История поступлений</h2>

      <Table
        :columns="columns"
        :rows="store.clientIncomeTransactions"
        :loading="store.loading"
        row-key="id"
      >
        <template #cell-date="{ value }">
          {{ formatDateTime(value) }}
        </template>

        <template #cell-counterparty_name="{ value }">
          {{ value || '—' }}
        </template>

        <template #cell-project_name="{ value }">
          {{ value || '—' }}
        </template>

        <template #cell-transaction_type_name="{ value }">
          {{ value || '—' }}
        </template>

        <template #cell-amount="{ value }">
          {{ formatMoney(value) }}
        </template>

        <template #actions="{ row }">
          <div class="actions">
            <button class="btn-secondary" @click="openEditModal(row)">
              Редактировать
            </button>

            <button
              class="btn-danger"
              :disabled="store.deletingId === row.id"
              @click="handleDelete(row)"
            >
              {{ store.deletingId === row.id ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </template>
      </Table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <h2>
            {{ isEditMode ? 'Редактировать поступление' : 'Добавить поступление' }}
          </h2>
          <button class="icon-btn" @click="closeModal">✕</button>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="field">
              <label>Дата и время *</label>
              <input
                v-model="form.date"
                type="datetime-local"
                required
              />
            </div>

            <div class="field">
              <label>Сумма *</label>
              <input
                v-model="form.amount"
                type="text"
                placeholder="Например 150000"
                required
              />
            </div>

            <div class="field">
              <label>Тип транзакции *</label>
              <select v-model="form.transaction_type" required>
                <option disabled value="">Выберите тип транзакции</option>
                <option
                  v-for="type in store.transactionTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name }} ({{ type.code }})
                </option>
              </select>
            </div>

            <div class="field">
              <label>Проект *</label>
              <select v-model="form.project" required>
                <option disabled value="">Выберите проект</option>
                <option
                  v-for="project in store.projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Клиент *</label>
              <select v-model="form.counterparty" required>
                <option disabled value="">Выберите клиента</option>
                <option
                  v-for="client in store.clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Категория расхода *</label>
              <input
                v-model="form.expense_category"
                type="number"
                placeholder="ID категории"
                required
              />
            </div>
          </div>

          <div v-if="errorText" class="error">
            {{ errorText }}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Отмена
            </button>
            <button type="submit" class="btn" :disabled="store.saving">
              {{ store.saving ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Table from '@/components/Table.vue'
import { useTransactionsStore } from '@/stores/transactions'

const store = useTransactionsStore()

const columns = [
  { key: 'date', label: 'Дата' },
  { key: 'counterparty_name', label: 'Клиент' },
  { key: 'project_name', label: 'Проект' },
  { key: 'transaction_type_name', label: 'Тип транзакции' },
  { key: 'amount', label: 'Сумма' },
]

const showModal = ref(false)
const errorText = ref('')
const editingId = ref(null)

const form = reactive({
  date: '',
  amount: '',
  transaction_type: '',
  project: '',
  counterparty: '',
  expense_category: '',
})

const isEditMode = computed(() => editingId.value !== null)

function getInitialForm() {
  return {
    date: '',
    amount: '',
    transaction_type: '',
    project: '',
    counterparty: '',
    expense_category: '',
  }
}

function resetForm() {
  Object.assign(form, getInitialForm())
  editingId.value = null
  errorText.value = ''
}

function toDatetimeLocalValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = num => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

function openEditModal(row) {
  errorText.value = ''
  editingId.value = row.id

  Object.assign(form, {
    date: toDatetimeLocalValue(row.date),
    amount: row.amount ?? '',
    transaction_type:
      typeof row.transaction_type === 'object'
        ? row.transaction_type.id
        : row.transaction_type ?? '',
    project: row.project ?? '',
    counterparty: row.counterparty ?? '',
    expense_category:
      typeof row.expense_category === 'object'
        ? row.expense_category.id
        : row.expense_category ?? '',
  })

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

/**
 * Формируем payload СТРОГО под POST /api/finance/transactions/
 */
function buildPayload() {
  return {
    date: new Date(form.date).toISOString(),
    amount: String(form.amount),
    transaction_type: Number(form.transaction_type),
    project: Number(form.project),
    counterparty: Number(form.counterparty),
    expense_category: Number(form.expense_category),
  }
}

async function handleSubmit() {
  errorText.value = ''

  try {
    if (!form.date) {
      errorText.value = 'Укажите дату'
      return
    }

    if (!form.amount) {
      errorText.value = 'Укажите сумму'
      return
    }

    if (!form.transaction_type) {
      errorText.value = 'Выберите тип транзакции'
      return
    }

    if (!form.project) {
      errorText.value = 'Выберите проект'
      return
    }

    if (!form.counterparty) {
      errorText.value = 'Выберите клиента'
      return
    }

    if (!form.expense_category) {
      errorText.value = 'Укажите категорию расхода'
      return
    }

    const payload = buildPayload()

    if (isEditMode.value) {
      await store.updateTransaction(editingId.value, payload)
    } else {
      await store.createTransaction(payload)
    }

    closeModal()
  } catch (error) {
    errorText.value =
      error?.response?.data?.detail ||
      'Не удалось сохранить поступление'
  }
}

async function handleDelete(row) {
  const confirmed = window.confirm('Удалить поступление?')
  if (!confirmed) return

  try {
    await store.deleteTransaction(row.id)
  } catch (error) {
    alert(error?.response?.data?.detail || 'Не удалось удалить поступление')
  }
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ru-RU')
}

onMounted(async () => {
  await store.initPage()
})
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