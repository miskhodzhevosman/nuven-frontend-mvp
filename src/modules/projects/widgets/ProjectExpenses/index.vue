<!-- modules/projects/widgets/ProjectExpenses/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Проектные расходы</h2>
      <button 
        id="add-expense-btn"
        class="btn btn-primary" 
        @click="openCreateExpense"
      >+ Добавить расход</button>
    </div>

    <div v-if="!expenses.length" class="state muted">Нет расходов.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th class="num">Сумма</th>
            <th>Тип расхода</th>
            <th>Комментарий</th>
            <th class="actions">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in expenses" :key="e.id">
            <td>{{ formatDate(e.date) }}</td>
            <td class="num">{{ formatAmount(e.amount) }}</td>
            <td>{{ e.operation_type_name || e.finance_operation_type || '—' }}</td>
            <td>{{ e.comment || e.description || '—' }}</td>
            <td class="actions">
              <button 
                class="btn btn-sm btn-ghost" 
                @click="openEditExpense(e)"
                title="Редактировать"
              >
                ✏️
              </button>
              <button 
                class="btn btn-sm btn-ghost" 
                @click="confirmDelete(e)"
                title="Удалить"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка: Создание/Редактирование расхода -->
    <ExpenseFormModal
      v-model="showModal"
      :project-id="projectId"
      :editing-id="editingId"
      @created="handleCreated"
      @updated="handleUpdated"
      @closed="handleModalClosed"
    />

    <!-- Модалка подтверждения удаления -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal modal-sm">
        <h2>Подтверждение удаления</h2>
        <p>Вы уверены, что хотите удалить расход?</p>
        <p class="text-muted">
          <strong>Сумма:</strong> {{ formatAmount(deletingExpense?.amount) }}<br>
          <strong>Тип:</strong> {{ deletingExpense?.operation_type_name || deletingExpense?.finance_operation_type || '—' }}
        </p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeDeleteModal">Отмена</button>
          <button class="btn btn-danger" @click="deleteExpense" :disabled="deleteLoading">
            {{ deleteLoading ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
        <div v-if="deleteError" class="alert alert-error">{{ deleteError }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { useFinanceStore } from '@/modules/finance/store'
import { storeToRefs } from 'pinia'
import ExpenseFormModal from '@/modules/projects/widgets/ProjectExpenses/components/ExpenseFormModal.vue'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const { projectExpenses } = storeToRefs(projectsStore)

// State
const showModal = ref(false)
const editingId = ref(null)
const showDeleteModal = ref(false)
const deletingExpense = ref(null)
const deleteLoading = ref(false)
const deleteError = ref(null)

// Computed
const expenses = computed(() => projectExpenses.value || [])

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

function openCreateExpense() {
  editingId.value = null
  showModal.value = true
}

function openEditExpense(expense) {
  editingId.value = expense.id
  showModal.value = true
}

async function handleCreated() {
  // Обновляем список расходов
  await projectsStore.fetchProjectExpenses(props.projectId)
  emit('refresh')
}

async function handleUpdated() {
  // Обновляем список расходов
  await projectsStore.fetchProjectExpenses(props.projectId)
  emit('refresh')
}

function handleModalClosed() {
  editingId.value = null
}

function confirmDelete(expense) {
  deletingExpense.value = expense
  showDeleteModal.value = true
  deleteError.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingExpense.value = null
  deleteLoading.value = false
  deleteError.value = null
}

async function deleteExpense() {
  if (!deletingExpense.value) return
  
  deleteLoading.value = true
  deleteError.value = null
  
  try {
    // Используем financeStore для удаления транзакции
    await financeStore.deleteTransaction(deletingExpense.value.id)
    
    // Обновляем список расходов в projectsStore
    await projectsStore.fetchProjectExpenses(props.projectId)
    emit('refresh')
    closeDeleteModal()
  } catch (e) {
    console.error('Failed to delete expense:', e)
    deleteError.value = e.message || 'Ошибка при удалении расхода'
  } finally {
    deleteLoading.value = false
  }
}

// Загружаем расходы при монтировании
onMounted(async () => {
  await projectsStore.fetchProjectExpenses(props.projectId)
  await financeStore.fetchOperationTypes()
  await projectsStore.fetchExpenseTypes()
})
</script>

<style scoped>
.actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  min-width: 80px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 14px;
  line-height: 1;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
}

.btn-ghost:hover {
  background: #f5f5f5;
  border-color: #ddd;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-sm {
  max-width: 400px;
}

.text-muted {
  color: #666;
  margin: 12px 0;
}

/* Стили для карточки и таблицы */
.card {
  background: #1e2126;
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

.btn-primary {
  background: #C9A86A;
  color: #16181C;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #d4b87a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 106, 0.3);
}

.state.muted {
  color: rgba(208, 210, 213, 0.5);
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table thead th {
  text-align: left;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(208, 210, 213, 0.1);
  color: rgba(208, 210, 213, 0.6);
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table thead th.num {
  text-align: right;
}

.table thead th.actions {
  text-align: center;
}

.table tbody td {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(208, 210, 213, 0.05);
  color: #D0D2D5;
}

.table tbody td.num {
  text-align: right;
  font-weight: 500;
  color: #C9A86A;
}

.table tbody td.actions {
  text-align: center;
}

.table tbody tr:hover {
  background: rgba(201, 168, 106, 0.05);
}

/* Модалка подтверждения */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 24, 28, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  background: #1e2126;
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.modal h2 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #C9A86A;
}

.modal p {
  color: #D0D2D5;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 12px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.15);
  color: #ef4444;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

@media (max-width: 768px) {
  .card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .card-header h2 {
    font-size: 16px;
  }
  
  .table thead th,
  .table tbody td {
    padding: 8px;
    font-size: 13px;
  }
  
  .actions {
    min-width: 60px;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 12px;
  }
  
  .table thead th,
  .table tbody td {
    padding: 6px;
    font-size: 12px;
  }
  
  .btn-sm {
    padding: 2px 6px;
    font-size: 12px;
  }
  
  .modal {
    padding: 20px;
    margin: 8px;
  }
}
</style>