<template>
  <div class="operation-expense-detail">
    <div class="page-header">
      <h1 class="page-title">Детали операционного расхода #{{ expense?.id }}</h1>
      <div class="page-actions">
        <button @click="goBack" class="btn btn-outline">
          <i class="fas fa-arrow-left"></i> Назад
        </button>
        <button @click="goToEdit" class="btn btn-warning" v-if="expense">
          <i class="fas fa-edit"></i> Редактировать
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="expense" class="detail-card">
      <div class="detail-grid">
        <div class="detail-item">
          <label>ID</label>
          <span>#{{ expense.id }}</span>
        </div>
        <div class="detail-item">
          <label>Тип операции</label>
          <span class="badge badge-info">{{ getOperationTypeName(expense.operation_type) }}</span>
        </div>
        <div class="detail-item">
          <label>Сумма</label>
          <span class="amount">{{ formatAmount(expense.amount) }}</span>
        </div>
        <div class="detail-item">
          <label>Статус</label>
          <span :class="['badge', getStatusClass(expense.status)]">
            {{ getStatusLabel(expense.status) }}
          </span>
        </div>
        <div class="detail-item">
          <label>Дата расхода</label>
          <span>{{ formatDate(expense.expense_date) }}</span>
        </div>
        <div class="detail-item">
          <label>Дата оплаты</label>
          <span>{{ formatDate(expense.payment_date) || '—' }}</span>
        </div>
        <div class="detail-item">
          <label>Проект</label>
          <span>{{ expense.project?.name || '—' }}</span>
        </div>
        <div class="detail-item">
          <label>Создан</label>
          <span>{{ formatDate(expense.created_at) }}</span>
        </div>
        <div class="detail-item full-width">
          <label>Описание</label>
          <span>{{ expense.description || '—' }}</span>
        </div>
        <div class="detail-item full-width">
          <label>Примечания</label>
          <span>{{ expense.notes || '—' }}</span>
        </div>
      </div>

      <!-- Документы -->
      <div v-if="expense.documents?.length" class="documents-section">
        <h3>Документы</h3>
        <div class="documents-list">
          <a v-for="doc in expense.documents" :key="doc.id" :href="doc.url" target="_blank" class="document-item">
            <i class="fas fa-file-pdf"></i>
            <span>{{ doc.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinanceStore } from '@/modules/finance/store'
import { useToast } from 'vue-toastification'

export default {
  name: 'OperationExpenseDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const financeStore = useFinanceStore()
    const toast = useToast()

    const expense = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const operationTypes = computed(() => financeStore.operationTypes)

    const loadExpense = async () => {
      const id = parseInt(route.params.id)
      if (!id) return

      loading.value = true
      error.value = null
      try {
        // Пытаемся найти в store
        const existing = financeStore.operationExpenses.find(e => e.id === id)
        if (existing) {
          expense.value = existing
        } else {
          // Если нет, загружаем
          expense.value = await financeStore.fetchOperationExpense(id)
        }
      } catch (e) {
        error.value = e.message || 'Ошибка загрузки данных'
        toast.error('Не удалось загрузить данные расхода')
      } finally {
        loading.value = false
      }
    }

    const getOperationTypeName = (typeId) => {
      const type = operationTypes.value.find(t => t.id === typeId)
      return type ? type.name : 'Неизвестный'
    }

    const getStatusLabel = (status) => {
      const labels = {
        pending: 'Ожидает',
        paid: 'Оплачен',
        cancelled: 'Отменен'
      }
      return labels[status] || status
    }

    const getStatusClass = (status) => {
      const classes = {
        pending: 'badge-warning',
        paid: 'badge-success',
        cancelled: 'badge-danger'
      }
      return classes[status] || 'badge-secondary'
    }

    const formatAmount = (amount) => {
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount) + ' ₽'
    }

    const formatDate = (date) => {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const goBack = () => {
      router.back()
    }

    const goToEdit = () => {
      router.push({ 
        name: 'operation-expense-edit', 
        params: { id: expense.value.id } 
      })
    }

    onMounted(async () => {
      if (operationTypes.value.length === 0) {
        await financeStore.fetchOperationTypes()
      }
      await loadExpense()
    })

    return {
      expense,
      loading,
      error,
      getOperationTypeName,
      getStatusLabel,
      getStatusClass,
      formatAmount,
      formatDate,
      goBack,
      goToEdit
    }
  }
}
</script>

<style scoped>
.operation-expense-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
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
  margin: 0;
}

.detail-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 30px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detail-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.detail-item span {
  font-size: 16px;
  color: #2c3e50;
}

.detail-item .amount {
  font-weight: 600;
  color: #28a745;
}

.documents-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.documents-section h3 {
  margin-bottom: 15px;
  font-size: 18px;
}

.documents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-decoration: none;
  color: #007bff;
  transition: all 0.2s;
}

.document-item:hover {
  background: #e9ecef;
  color: #0056b3;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert {
  padding: 12px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-danger {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-outline {
  background: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.badge-info {
  background: #d1ecf1;
  color: #0c5460;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background: #e2e3e5;
  color: #383d41;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>