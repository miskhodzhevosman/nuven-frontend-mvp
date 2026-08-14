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
/* ============================================
   OPERATION EXPENSES LIST - Светлая тема, полная ширина
   Единый стиль с FactoryList
   ============================================ */

.operation-expenses-list {
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
  max-width: 100%;
}

/* ============================================
   ЗАГОЛОВОК СТРАНИЦЫ
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
  background: #FFFFFF;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #E8ECF2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.btn-primary {
  background: #2C3E50;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
}

.btn-primary:hover {
  background: #1a2a3a;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.18);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
}

.btn-primary::before {
  content: '+';
  font-size: 18px;
  font-weight: 400;
}

.btn-outline-primary {
  background: transparent;
  color: #2C3E50;
  border: 1px solid #E2E6EE;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-outline-primary:hover {
  background: #F8F9FA;
  border-color: #2C3E50;
  transform: translateY(-1px);
}

.btn-outline-danger {
  background: transparent;
  color: #DC2626;
  border: 1px solid #E2E6EE;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-outline-danger:hover {
  background: #FEF2F2;
  border-color: #DC2626;
  transform: translateY(-1px);
}

.btn-outline-secondary {
  background: transparent;
  color: #6B7A8F;
  border: 1px solid #E2E6EE;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #F8F9FA;
  border-color: #6B7A8F;
  transform: translateY(-1px);
}

.btn-outline-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* ============================================
   ЗАГРУЗКА
   ============================================ */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #E8ECF2;
  border-top: 3px solid #2C3E50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============================================
   ALERT
   ============================================ */
.alert {
  padding: 14px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.alert-danger {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #991B1B;
}

.alert-danger i {
  font-size: 18px;
}

/* ============================================
   КАРТОЧКА С ТАБЛИЦЕЙ
   ============================================ */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E8ECF2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.card-body {
  padding: 0;
  width: 100%;
}

/* ============================================
   ПУСТОЕ СОСТОЯНИЕ
   ============================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9AA3B2;
}

.empty-state i {
  font-size: 48px;
  color: #E2E6EE;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

.empty-state .btn {
  margin: 0 auto;
}

/* ============================================
   ТАБЛИЦА
   ============================================ */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

.table thead {
  background: #F8F9FA;
  border-bottom: 1px solid #E8ECF2;
}

.table th {
  padding: 14px 20px;
  text-align: left;
  font-weight: 600;
  color: #1A1A1A;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 2px solid #E8ECF2;
}

.table td {
  padding: 14px 20px;
  border-bottom: 1px solid #F0F2F5;
  color: #1A1A1A;
  word-break: break-word;
}

.table tbody tr {
  transition: background 0.2s ease;
}

.table tbody tr:hover {
  background: #F8F9FA;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Ширина колонок */
.table th:nth-child(1),
.table td:nth-child(1) {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
}

.table th:nth-child(2),
.table td:nth-child(2) {
  width: 15%;
  min-width: 120px;
}

.table th:nth-child(3),
.table td:nth-child(3) {
  width: 15%;
  min-width: 120px;
}

.table th:nth-child(4),
.table td:nth-child(4) {
  width: 20%;
  min-width: 150px;
}

.table th:nth-child(5),
.table td:nth-child(5) {
  width: 30%;
  min-width: 150px;
}

.table th:nth-child(6),
.table td:nth-child(6) {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  text-align: center;
}

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: #F0F2F5;
  color: #1A1A1A;
}

.badge-info {
  background: #E8F0FE;
  color: #2C3E50;
}

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-buttons .btn {
  padding: 6px 10px;
  font-size: 12px;
  white-space: nowrap;
}

.action-buttons .btn i {
  font-size: 13px;
}

/* ============================================
   ПАГИНАЦИЯ
   ============================================ */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #E8ECF2;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  color: #6B7A8F;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-current {
  font-size: 14px;
  color: #1A1A1A;
  font-weight: 500;
}

/* ============================================
   АНИМАЦИИ
   ============================================ */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table tbody tr {
  animation: fadeInUp 0.3s ease forwards;
}

.table tbody tr:nth-child(1) { animation-delay: 0.02s; }
.table tbody tr:nth-child(2) { animation-delay: 0.04s; }
.table tbody tr:nth-child(3) { animation-delay: 0.06s; }
.table tbody tr:nth-child(4) { animation-delay: 0.08s; }
.table tbody tr:nth-child(5) { animation-delay: 0.10s; }
.table tbody tr:nth-child(6) { animation-delay: 0.12s; }
.table tbody tr:nth-child(7) { animation-delay: 0.14s; }
.table tbody tr:nth-child(8) { animation-delay: 0.16s; }
.table tbody tr:nth-child(9) { animation-delay: 0.18s; }
.table tbody tr:nth-child(10) { animation-delay: 0.20s; }

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */

/* Планшеты */
@media (max-width: 992px) {
  .table th,
  .table td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .table th:nth-child(6),
  .table td:nth-child(6) {
    width: 160px;
    min-width: 160px;
    max-width: 160px;
  }
}

/* Мобильные устройства */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
    border-radius: 10px;
  }

  .page-actions {
    width: 100%;
  }

  .page-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .table {
    min-width: 700px;
    width: 100%;
  }

  .table th,
  .table td {
    padding: 10px 14px;
    font-size: 13px;
  }

  .table th:nth-child(6),
  .table td:nth-child(6) {
    width: 140px;
    min-width: 140px;
    max-width: 140px;
  }

  .pagination-wrapper {
    flex-direction: column;
    align-items: center;
    padding: 14px 16px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Маленькие телефоны */
@media (max-width: 480px) {
  .page-header {
    padding: 12px;
    border-radius: 8px;
  }

  .page-title {
    font-size: 18px;
  }

  .btn {
    font-size: 13px;
    padding: 8px 16px;
  }

  .table {
    min-width: 600px;
  }

  .table th,
  .table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .table th:nth-child(1),
  .table td:nth-child(1) {
    width: 50px;
    min-width: 50px;
    max-width: 50px;
  }

  .table th:nth-child(6),
  .table td:nth-child(6) {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .action-buttons .btn {
    font-size: 11px;
    padding: 4px 8px;
  }

  .badge {
    font-size: 11px;
    padding: 3px 8px;
  }

  .pagination-wrapper {
    padding: 12px;
  }

  .pagination-info {
    font-size: 13px;
  }

  .pagination-current {
    font-size: 13px;
  }

  .pagination-controls .btn {
    font-size: 12px;
    padding: 4px 10px;
  }
}
</style>