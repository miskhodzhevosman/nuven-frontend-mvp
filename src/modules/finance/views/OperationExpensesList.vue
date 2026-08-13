<template>
  <div class="operation-expenses-list">
    <div class="page-header">
      <h1 class="page-title">Операционные расходы</h1>
      <div class="page-actions">
        <button @click="createExpense" class="btn btn-primary">
          <i class="fas fa-plus"></i> Добавить расход
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <div v-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-circle"></i>
      {{ formatError(error) }}
    </div>

    <!-- Таблица расходов -->
    <div class="card">
      <div class="card-body">
        <div v-if="expenses.length === 0" class="empty-state">
          <i class="fas fa-file-invoice-dollar"></i>
          <p>Нет операционных расходов</p>
          <button @click="createExpense" class="btn btn-primary">
            Добавить первый расход
          </button>
        </div>

        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Сумма</th>
                <th>Тип операции</th>
                <th>Комментарий</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td>{{ expense.id }}</td>
                <td>{{ formatDate(expense.date) }}</td>
                <td>{{ formatAmount(expense.amount) }}</td>
                <td>
                  <span class="badge badge-info">
                    {{ expense.operation_type_name || expense.operation_type_code }}
                  </span>
                </td>
                <td>{{ expense.comment || '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="editExpense(expense.id)" class="btn btn-sm btn-outline-primary">
                      <i class="fas fa-edit">Редактировать</i>
                    </button>
                    <button @click="deleteExpense(expense.id)" class="btn btn-sm btn-outline-danger">
                      <i class="fas fa-trash">Удалить</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="pagination" class="pagination-wrapper">
          <div class="pagination-info">
            Показано {{ expenses.length }} из {{ pagination.total }} записей
          </div>
          <div class="pagination-controls">
            <button 
              @click="changePage(pagination.current - 1)" 
              :disabled="!pagination.hasPrevious"
              class="btn btn-sm btn-outline-secondary"
            >
              Предыдущая
            </button>
            <span class="pagination-current">
              Страница {{ pagination.current }} из {{ pagination.totalPages }}
            </span>
            <button 
              @click="changePage(pagination.current + 1)" 
              :disabled="!pagination.hasNext"
              class="btn btn-sm btn-outline-secondary"
            >
              Следующая
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/modules/finance/store'

export default {
  name: 'OperationExpensesList',
  
  setup() {
    const router = useRouter()
    const financeStore = useFinanceStore()

    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(20)

    // Геттеры
    const expenses = computed(() => financeStore.operationExpenses || [])
    const pagination = computed(() => {
      if (financeStore.operationExpensesPagination) {
        return financeStore.operationExpensesPagination
      }
      return null
    })

    // Методы
    const loadExpenses = async (page = 1) => {
      loading.value = true
      error.value = null
      try {
        const params = {
          page: page,
          page_size: pageSize.value
        }
        await financeStore.fetchOperationExpenses(params)
        currentPage.value = page
      } catch (err) {
        console.error('Error loading expenses:', err)
        error.value = err
      } finally {
        loading.value = false
      }
    }

    const changePage = (page) => {
      if (page < 1) return
      if (pagination.value && page > pagination.value.totalPages) return
      loadExpenses(page)
    }

    const createExpense = () => {
      router.push('/finance/operation-expenses/create')
    }

    const editExpense = (id) => {
      router.push(`/finance/operation-expenses/${id}/edit/`)
    }

    const deleteExpense = async (id) => {
      if (!confirm('Вы уверены, что хотите удалить этот расход?')) return
      
      try {
        await financeStore.deleteOperationExpense(id)
        await loadExpenses(currentPage.value)
      } catch (err) {
        console.error('Error deleting expense:', err)
        alert('Ошибка при удалении расхода')
      }
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ru-RU')
    }

    const formatAmount = (amount) => {
      if (!amount) return '0.00'
      return Number(amount).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatError = (err) => {
      if (typeof err === 'string') return err
      if (err?.message) return err.message
      return 'Произошла неизвестная ошибка'
    }

    onMounted(() => {
      loadExpenses(1)
    })

    return {
      expenses,
      loading,
      error,
      pagination,
      currentPage,
      loadExpenses,
      changePage,
      createExpense,
      editExpense,
      deleteExpense,
      formatDate,
      formatAmount,
      formatError
    }
  }
}
</script>

<style scoped>
.operation-expenses-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state i {
  font-size: 48px;
  color: #6c757d;
  margin-bottom: 20px;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 20px;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 15px;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.badge-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background-color: #007bff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-outline-primary {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  color: #fff;
}

.btn-outline-danger {
  background-color: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: #fff;
}

.btn-outline-secondary {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #6c757d;
  color: #fff;
}

.btn-outline-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.alert {
  padding: 15px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-danger i {
  font-size: 18px;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  margin-top: 20px;
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pagination-current {
  font-size: 14px;
  color: #495057;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: center;
  }
}
</style>