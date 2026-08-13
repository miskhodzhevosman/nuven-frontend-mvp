<template>
  <div class="operation-expense-create">
    <div class="page-header">
      <h1 class="page-title">{{ isEditing ? 'Редактирование' : 'Добавление' }} операционного расхода</h1>
      <div class="page-actions">
        <button @click="goBack" class="btn btn-outline">
          <i class="fas fa-arrow-left"></i> Назад
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

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="expense-form">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">Основная информация</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="date" class="required">Дата</label>
                <input 
                  type="date" 
                  id="date" 
                  v-model="form.date" 
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.date }"
                />
                <div v-if="errors.date" class="invalid-feedback">
                  {{ errors.date }}
                </div>
              </div>

              <div class="form-group">
                <label for="amount" class="required">Сумма</label>
                <input 
                  type="number" 
                  id="amount" 
                  v-model="form.amount" 
                  required
                  min="0.01"
                  step="0.01"
                  class="form-control"
                  :class="{ 'is-invalid': errors.amount }"
                  placeholder="0.00"
                />
                <div v-if="errors.amount" class="invalid-feedback">
                  {{ errors.amount }}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="expense_type_name" class="required">Тип операции</label>
              <div class="type-input-wrapper">
                <input 
                  type="text" 
                  id="expense_type_name" 
                  v-model="form.expense_type_name" 
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.expense_type_name }"
                  placeholder="Начните вводить название типа операции..."
                  @input="onTypeInput"
                  @focus="showSuggestions = true"
                  @blur="handleBlur"
                  @keydown.down.prevent="selectNextSuggestion"
                  @keydown.up.prevent="selectPreviousSuggestion"
                  @keydown.enter.prevent="selectCurrentSuggestion"
                />
                
                <!-- Список подсказок -->
                <div v-if="filteredSuggestions.length > 0 && showSuggestions" class="suggestions-dropdown">
                  <div 
                    v-for="(type, index) in filteredSuggestions" 
                    :key="type.id"
                    class="suggestion-item"
                    :class="{ 'suggestion-item-active': selectedSuggestionIndex === index }"
                    @mousedown.prevent="selectSuggestion(type.name)"
                    @mouseenter="selectedSuggestionIndex = index"
                  >
                    <i class="fas fa-tag"></i>
                    <span class="suggestion-name">{{ type.name }}</span>
                    <span class="suggestion-code">{{ type.code }}</span>
                  </div>
                  
                  <!-- Индикатор создания нового типа -->
                  <div v-if="isNewType" class="suggestion-item new-type">
                    <i class="fas fa-plus-circle"></i>
                    <span>Создать новый тип: <strong>"{{ form.expense_type_name }}"</strong></span>
                  </div>
                </div>
              </div>
              <small class="form-text text-muted">
                Введите название типа операции. Если такого типа нет в списке, он будет создан автоматически.
              </small>
              <div v-if="errors.expense_type_name" class="invalid-feedback">
                {{ errors.expense_type_name }}
              </div>
            </div>

            <div class="form-group">
              <label for="comment">Комментарий</label>
              <textarea 
                id="comment" 
                v-model="form.comment" 
                rows="3"
                class="form-control"
                :class="{ 'is-invalid': errors.comment }"
                placeholder="Введите комментарий к расходу"
              ></textarea>
              <div v-if="errors.comment" class="invalid-feedback">
                {{ errors.comment }}
              </div>
            </div>
          </div>

          <!-- Кнопки формы -->
          <div class="form-actions">
            <button type="button" @click="goBack" class="btn btn-secondary">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              {{ loading ? 'Сохранение...' : isEditing ? 'Обновить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFinanceStore } from '@/modules/finance/store'
import { financeApi } from '@/modules/finance/api'

export default {
  name: 'OperationExpenseCreate',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const financeStore = useFinanceStore()

    // Определяем, редактирование или создание
    const expenseId = route.params.id
    const isEditing = computed(() => !!expenseId)

    // Состояние формы
    const form = ref({
      date: '',
      amount: '',
      comment: '',
      expense_type_name: ''
    })

    const errors = ref({})
    const loading = ref(false)
    const error = ref(null)
    const showSuggestions = ref(false)
    const selectedSuggestionIndex = ref(-1)
    const operationTypesList = ref([])

    // Геттеры
    const operationTypes = computed(() => financeStore.operationTypes)

    // Фильтрованные предложения
    const filteredSuggestions = computed(() => {
      if (!form.value.expense_type_name || !form.value.expense_type_name.trim()) {
        return []
      }
      
      const query = form.value.expense_type_name.toLowerCase().trim()
      
      return operationTypesList.value
        .filter(type => type.name.toLowerCase().includes(query))
        .slice(0, 10)
    })

    // Проверка, является ли введенное значение новым типом
    const isNewType = computed(() => {
      if (!form.value.expense_type_name || !form.value.expense_type_name.trim()) {
        return false
      }
      
      const query = form.value.expense_type_name.trim()
      return !operationTypesList.value.some(
        type => type.name.toLowerCase() === query.toLowerCase()
      )
    })

    // Методы для работы с подсказками
    const onTypeInput = () => {
      showSuggestions.value = true
      selectedSuggestionIndex.value = -1
    }

    const handleBlur = () => {
      setTimeout(() => {
        showSuggestions.value = false
      }, 200)
    }

    const selectSuggestion = (name) => {
      form.value.expense_type_name = name
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
    }

    const selectNextSuggestion = () => {
      if (filteredSuggestions.value.length === 0) return
      
      if (selectedSuggestionIndex.value < filteredSuggestions.value.length - 1) {
        selectedSuggestionIndex.value++
        // Прокручиваем к выбранному элементу
        const items = document.querySelectorAll('.suggestion-item')
        if (items[selectedSuggestionIndex.value]) {
          items[selectedSuggestionIndex.value].scrollIntoView({ block: 'nearest' })
        }
      }
    }

    const selectPreviousSuggestion = () => {
      if (selectedSuggestionIndex.value > 0) {
        selectedSuggestionIndex.value--
        const items = document.querySelectorAll('.suggestion-item')
        if (items[selectedSuggestionIndex.value]) {
          items[selectedSuggestionIndex.value].scrollIntoView({ block: 'nearest' })
        }
      }
    }

    const selectCurrentSuggestion = () => {
      if (selectedSuggestionIndex.value >= 0 && selectedSuggestionIndex.value < filteredSuggestions.value.length) {
        const selected = filteredSuggestions.value[selectedSuggestionIndex.value]
        selectSuggestion(selected.name)
      }
    }

    // Загрузка типов операций
    const loadOperationTypes = async () => {
      try {
        // Если в store уже есть типы, используем их
        if (financeStore.operationTypes && financeStore.operationTypes.length > 0) {
          operationTypesList.value = financeStore.operationTypes
          return
        }

        // Иначе загружаем через store
        await financeStore.fetchOperationTypes()
        operationTypesList.value = financeStore.operationTypes
      } catch (err) {
        console.error('Error loading operation types:', err)
        // Если ошибка, пробуем загрузить напрямую через api
        try {
          const types = await financeApi.getOperationTypes()
          operationTypesList.value = types.results || types || []
        } catch (e) {
          console.error('Error loading types directly:', e)
        }
      }
    }

    // Валидация формы
    const validateForm = () => {
      errors.value = {}
      let isValid = true

      if (!form.value.date) {
        errors.value.date = 'Выберите дату'
        isValid = false
      }

      if (!form.value.expense_type_name || !form.value.expense_type_name.trim()) {
        errors.value.expense_type_name = 'Введите тип операции'
        isValid = false
      }

      if (!form.value.amount || form.value.amount <= 0) {
        errors.value.amount = 'Введите корректную сумму'
        isValid = false
      }

      if (form.value.amount && form.value.amount > 999999999.99) {
        errors.value.amount = 'Сумма не может превышать 999,999,999.99'
        isValid = false
      }

      return isValid
    }

    const showSuccess = (message) => {
      alert(message)
    }

    const showError = (message) => {
      alert('Ошибка: ' + message)
    }

    // Отправка формы
    const handleSubmit = async () => {
      if (!validateForm()) {
        showError('Пожалуйста, исправьте ошибки в форме')
        return
      }

      loading.value = true
      error.value = null

      try {
        const payload = {
          date: form.value.date,
          amount: form.value.amount.toString(),
          comment: form.value.comment || '',
          expense_type_name: form.value.expense_type_name.trim()
        }

        let result
        if (isEditing.value) {
          result = await financeStore.updateOperationExpense(expenseId, payload)
          showSuccess('Операционный расход успешно обновлен!')
        } else {
          result = await financeStore.createOperationExpense(payload)
          showSuccess('Операционный расход успешно создан!')
        }

        router.push('/finance/operation-expenses')
      } catch (err) {
        console.error('Error saving operation expense:', err)
        error.value = err
        
        if (err.response?.data) {
          const serverErrors = err.response.data
          Object.keys(serverErrors).forEach(key => {
            if (Array.isArray(serverErrors[key])) {
              errors.value[key] = serverErrors[key][0]
            } else {
              errors.value[key] = serverErrors[key]
            }
          })
          showError('Ошибка при сохранении расхода')
        } else {
          showError('Произошла ошибка при сохранении')
        }
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/finance/operation-expenses')
    }

    const formatError = (err) => {
      if (typeof err === 'string') return err
      if (err?.message) return err.message
      return 'Произошла неизвестная ошибка'
    }

    // Загрузка данных для редактирования
    const loadExpenseData = async () => {
      if (!isEditing.value) return

      try {
        loading.value = true
        const expense = await financeApi.getOperationExpense(expenseId)
        
        form.value = {
          date: expense.date || '',
          amount: expense.amount || '',
          comment: expense.comment || '',
          expense_type_name: expense.operation_type_name || ''
        }
      } catch (err) {
        console.error('Error loading expense data:', err)
        error.value = err
        showError('Ошибка загрузки данных расхода')
      } finally {
        loading.value = false
      }
    }

    // Инициализация
    onMounted(async () => {
      // Загружаем типы операций
      await loadOperationTypes()
      
      // Устанавливаем дату по умолчанию для создания
      if (!isEditing.value && !form.value.date) {
        const today = new Date().toISOString().split('T')[0]
        form.value.date = today
      }

      // Если редактирование, загружаем данные
      if (isEditing.value) {
        await loadExpenseData()
      }
    })

    return {
      form,
      errors,
      loading,
      error,
      operationTypes,
      isEditing,
      showSuggestions,
      filteredSuggestions,
      isNewType,
      selectedSuggestionIndex,
      handleSubmit,
      goBack,
      formatError,
      onTypeInput,
      handleBlur,
      selectSuggestion,
      selectNextSuggestion,
      selectPreviousSuggestion,
      selectCurrentSuggestion
    }
  }
}
</script>

<style scoped>
.operation-expense-create {
  padding: 20px;
  max-width: 800px;
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
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.required::after {
  content: '*';
  color: #dc3545;
  margin-left: 4px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.invalid-feedback {
  display: block;
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.type-input-wrapper {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 2px;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item-active {
  background-color: #f0f7ff;
}

.suggestion-item i {
  color: #6c757d;
  width: 16px;
  flex-shrink: 0;
}

.suggestion-name {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
}

.suggestion-code {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.suggestion-item.new-type {
  border-top: 1px solid #e9ecef;
  color: #28a745;
  background: #f8fff9;
}

.suggestion-item.new-type:hover {
  background: #e6f9ed;
}

.suggestion-item.new-type i {
  color: #28a745;
}

.suggestion-item.new-type strong {
  color: #1e7e34;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6c757d;
}

.text-muted {
  color: #6c757d !important;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: #007bff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-outline {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline:hover {
  background-color: #6c757d;
  color: #fff;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .card-body {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>