<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFinanceStore } from '../store'  // ← поднимаемся из views/ в finance/

const store = useFinanceStore()
const { transactions, operationTypes, loading, error, count } = storeToRefs(store)

const showForm = ref(false)
const editingId = ref(null)
const confirmId = ref(null)

const emptyForm = () => ({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  finance_operation_type: '',
  project: '',
  counterparty: '',
  comment: '',
})

const form = reactive(emptyForm())
const formRef = ref(null)

const formTitle = computed(() => (editingId.value ? 'Редактировать операцию' : 'Новая операция'))

const operationTypeOptions = computed(() => operationTypes.value)

function operationTypeName(id) {
  if (!id) return '—'
  const t = operationTypes.value.find((x) => x.id === Number(id))
  return t ? t.name : `#${id}`
}

function operationTypeBadgeClass(id) {
  const code = operationTypes.value.find((x) => x.id === Number(id))?.code
  switch (code) {
    case 'client_payment': return 'badge badge-green'
    case 'factory_payment': return 'badge badge-blue'
    case 'project_expense': return 'badge badge-orange'
    case 'operation_expense': return 'badge badge-red'
    default: return 'badge badge-gray'
  }
}

function formatAmount(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n)
    ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(v)
}

function formatDate(d) {
  if (!d) return '—'
  return d.slice(0, 10)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  showForm.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.amount = item.amount ?? ''
  form.date = item.date ?? ''
  form.finance_operation_type = item.finance_operation_type ?? ''
  form.project = item.project ?? ''
  form.counterparty = item.counterparty ?? ''
  form.comment = item.comment ?? ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  if (!formRef.value?.checkValidity()) return
  const payload = {
    amount: String(form.amount),
    date: form.date,
    finance_operation_type: Number(form.finance_operation_type),
    project: form.project ? Number(form.project) : null,
    counterparty: form.counterparty ? Number(form.counterparty) : null,
    comment: form.comment || null,
  }
  try {
    if (editingId.value) {
      await store.updateTransaction(editingId.value, payload)
    } else {
      await store.createTransaction(payload)
    }
    closeForm()
  } catch (e) {
    // error уже в store.error
  }
}

async function confirmDelete(id) {
  try {
    await store.deleteTransaction(id)
  } finally {
    confirmId.value = null
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchOperationTypes(),
      store.fetchTransactions(),
    ])
  } catch {
    // ошибки сохранены в store.error
  }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h1>Финансы</h1>
        <p class="muted">Операции и транзакции. Всего записей: {{ count }}</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Новая операция</button>
    </header>

    <div v-if="error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ error }}</span>
    </div>

    <div v-if="loading && !transactions.length" class="state">Загрузка…</div>
    <div v-else-if="!transactions.length && !error" class="state muted">
      Нет операций. Создайте первую.
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Дата</th>
            <th>Тип операции</th>
            <th class="num">Сумма</th>
            <th>Проект</th>
            <th>Контрагент</th>
            <th>Комментарий</th>
            <th class="actions">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transactions" :key="t.id">
            <td>{{ t.id }}</td>
            <td>{{ formatDate(t.date) }}</td>
            <td>
              <span :class="operationTypeBadgeClass(t.finance_operation_type)">
                {{ operationTypeName(t.finance_operation_type) }}
              </span>
            </td>
            <td class="num">{{ formatAmount(t.amount) }}</td>
            <td>{{ t.project ?? '—' }}</td>
            <td>{{ t.counterparty ?? '—' }}</td>
            <td class="comment">{{ t.comment || '—' }}</td>
            <td class="actions">
              <button class="btn btn-ghost" @click="openEdit(t)">Изменить</button>
              <button class="btn btn-danger" @click="confirmId = t.id">Удалить</button>
              <span v-if="confirmId === t.id" class="confirm">
                Точно?
                <button class="btn btn-danger" @click="confirmDelete(t.id)">Да</button>
                <button class="btn btn-ghost" @click="confirmId = null">Нет</button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальная форма -->
    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <div class="modal">
        <h2>{{ formTitle }}</h2>
        <form ref="formRef" @submit.prevent="submitForm">
          <label class="field">
            <span>Сумма *</span>
            <input
              v-model="form.amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
            />
          </label>

          <label class="field">
            <span>Дата *</span>
            <input v-model="form.date" type="date" required />
          </label>

          <label class="field">
            <span>Тип операции *</span>
            <select v-model="form.finance_operation_type" required>
              <option value="" disabled>— выберите —</option>
              <option v-for="t in operationTypeOptions" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.code }})
              </option>
            </select>
          </label>

          <label class="field">
            <span>Проект (ID)</span>
            <input v-model="form.project" type="number" placeholder="необязательно" />
          </label>

          <label class="field">
            <span>Контрагент (ID)</span>
            <input v-model="form.counterparty" type="number" placeholder="необязательно" />
          </label>

          <label class="field">
            <span>Комментарий</span>
            <textarea v-model="form.comment" rows="2" placeholder="необязательно"></textarea>
          </label>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #1f2937;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
.muted { color: #6b7280; font-size: 14px; }

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

.state { padding: 32px; text-align: center; }

.table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}
.table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  position: sticky;
  top: 0;
}
.table tbody tr:hover { background: #f9fafb; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.comment { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.actions { white-space: nowrap; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.badge-green { background: #dcfce7; color: #166534; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-orange { background: #ffedd5; color: #9a3412; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-gray { background: #e5e7eb; color: #374151; }

.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-ghost { background: transparent; color: #334155; border-color: #cbd5e1; }
.btn-ghost:hover { background: #f1f5f9; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.confirm { margin-left: 8px; display: inline-flex; gap: 4px; align-items: center; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.1);
}
.modal h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
.field { display: block; margin-bottom: 14px; }
.field span { display: block; margin-bottom: 4px; font-size: 13px; color: #374151; font-weight: 500; }
.field input, .field select, .field textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .15);
}
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

@media (max-width: 640px) {
  .page { padding: 16px; }
  .page-header { flex-direction: column; }
}
</style>
