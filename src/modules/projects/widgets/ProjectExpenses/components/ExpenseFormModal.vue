<!-- modules/projects/widgets/ProjectExpenses/components/ExpenseFormModal.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>{{ isEditing ? 'Редактировать расход' : 'Новый расход' }}</h2>
      <form ref="formRef" @submit.prevent="submit">
        <label class="field">
          <span>Дата *</span>
          <input 
            v-model="form.date" 
            type="date" 
            required 
          />
        </label>
        
        <label class="field">
          <span>Сумма *</span>
          <input 
            v-model="form.amount" 
            type="number" 
            step="0.01" 
            min="0" 
            required 
          />
        </label>
        
        <label class="field">
          <span>Тип расхода *</span>
          <div class="combobox-wrapper">
            <input
              v-model="expenseTypeSearch"
              type="text"
              placeholder="Введите или выберите тип расхода"
              @input="onExpenseTypeInput"
              @focus="showExpenseTypeSuggestions = true"
              @blur="onExpenseTypeBlur"
              required
              autocomplete="off"
            />
            <button 
              type="button" 
              class="combobox-toggle" 
              @mousedown.prevent="toggleExpenseTypeSuggestions"
            >
              ▼
            </button>
            <ul 
              v-if="showExpenseTypeSuggestions && filteredExpenseTypes.length > 0" 
              class="combobox-suggestions"
            >
              <li 
                v-for="type in filteredExpenseTypes" 
                :key="type.id"
                @mousedown.prevent="selectExpenseType(type)"
              >
                {{ type.name }}
              </li>
              <li 
                v-if="expenseTypeSearch && !isExpenseTypeExists"
                class="combobox-create-new"
              >
                ✚ Будет создан новый тип "{{ expenseTypeSearch }}"
              </li>
            </ul>
          </div>
          <small v-if="expenseTypeSearch && !isExpenseTypeExists" class="hint warning">
            ✚ Будет создан новый тип расхода "{{ expenseTypeSearch }}"
          </small>
          <small v-else-if="selectedExpenseType" class="hint success">
            ✓ Выбран тип: {{ selectedExpenseType.name }}
          </small>
          <small v-else class="hint">
            Начните вводить название или выберите из списка
          </small>
        </label>
        
        <label class="field">
          <span>Комментарий</span>
          <textarea 
            v-model="form.comment" 
            rows="3"
            placeholder="Дополнительная информация"
          ></textarea>
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="loading || !expenseTypeSearch"
          >
            {{ loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать') }}
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="validationErrors" class="alert alert-error">
          <div v-for="(errors, field) in validationErrors" :key="field">
            <strong>{{ field }}:</strong> {{ errors.join(', ') }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from 'vue'
import { useFinanceStore } from '@/modules/finance/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  projectId: {
    type: Number,
    required: true,
  },
  editingId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'created', 'updated', 'closed'])

const financeStore = useFinanceStore()
const { operationTypes, projectExpenses } = storeToRefs(financeStore)

const formRef = ref(null)
const loading = ref(false)
const error = ref(null)
const validationErrors = ref(null)

const form = reactive({
  date: '',
  amount: '',
  comment: '',
  expense_type_name: '',
})

// Expense type autocomplete state
const expenseTypeSearch = ref('')
const showExpenseTypeSuggestions = ref(false)
const selectedExpenseType = ref(null)

// Computed
const isEditing = computed(() => !!props.editingId)

// Список типов расходов (только PROJECT_EXPENSE)
const expenseTypesList = computed(() => {
  if (!operationTypes.value) return []
  return operationTypes.value.filter(t => t.code === 'project_expense')
})

// Фильтруем типы расходов для поиска
const filteredExpenseTypes = computed(() => {
  if (!expenseTypeSearch.value) return expenseTypesList.value || []
  const search = expenseTypeSearch.value.toLowerCase().trim()
  return (expenseTypesList.value || [])
    .filter(t => t.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// Проверяем, существует ли уже такой тип
const isExpenseTypeExists = computed(() => {
  if (!expenseTypeSearch.value) return false
  return (expenseTypesList.value || []).some(t => 
    t.name.toLowerCase() === expenseTypeSearch.value.toLowerCase().trim()
  )
})

// Reset form
function resetForm() {
  const today = new Date().toISOString().slice(0, 10)
  Object.assign(form, {
    date: today,
    amount: '',
    comment: '',
    expense_type_name: '',
  })
  expenseTypeSearch.value = ''
  selectedExpenseType.value = null
  showExpenseTypeSuggestions.value = false
  error.value = null
  validationErrors.value = null
}

// Load expense for editing
async function loadExpenseForEdit() {
  if (!props.editingId) {
    resetForm()
    return
  }
  
  try {
    // Сначала ищем в store
    let expense = projectExpenses.value?.find(e => e.id === props.editingId)
    
    // Если не нашли в store - загружаем через API
    if (!expense) {
      expense = await financeStore.fetchProjectExpense(props.editingId)
    }
    
    if (expense) {
      form.date = expense.date?.slice(0, 10) || ''
      form.amount = expense.amount || ''
      form.comment = expense.comment || ''
      
      // Находим тип расхода
      const operationTypeId = expense.finance_operation_type || expense.operation_type_id
      
      if (operationTypeId) {
        const expenseType = expenseTypesList.value?.find(t => t.id === operationTypeId)
        if (expenseType) {
          selectedExpenseType.value = expenseType
          expenseTypeSearch.value = expenseType.name
          form.expense_type_name = expenseType.name
        } else {
          // Если тип не найден по ID, пробуем по имени
          const typeName = expense.operation_type_name || expense.finance_operation_type_name
          if (typeName) {
            expenseTypeSearch.value = typeName
            form.expense_type_name = typeName
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load expense:', e)
    error.value = 'Не удалось загрузить данные расхода'
  }
}

// --- Expense type methods ---
function onExpenseTypeInput() {
  if (selectedExpenseType.value && expenseTypeSearch.value !== selectedExpenseType.value.name) {
    selectedExpenseType.value = null
    form.expense_type_name = ''
  }
  showExpenseTypeSuggestions.value = true
}

function onExpenseTypeBlur() {
  setTimeout(() => {
    showExpenseTypeSuggestions.value = false
    if (expenseTypeSearch.value && !selectedExpenseType.value) {
      if (isExpenseTypeExists.value) {
        const found = (expenseTypesList.value || []).find(t => 
          t.name.toLowerCase() === expenseTypeSearch.value.toLowerCase().trim()
        )
        if (found) {
          selectExpenseType(found)
        }
      }
    }
  }, 200)
}

function toggleExpenseTypeSuggestions() {
  showExpenseTypeSuggestions.value = !showExpenseTypeSuggestions.value
  if (showExpenseTypeSuggestions.value && !expenseTypeSearch.value) {
    expenseTypeSearch.value = ''
  }
}

function selectExpenseType(type) {
  selectedExpenseType.value = type
  expenseTypeSearch.value = type.name
  form.expense_type_name = type.name
  showExpenseTypeSuggestions.value = false
  error.value = null
  validationErrors.value = null
}

// Submit
async function submit() {
  // Проверяем валидность формы
  if (!formRef.value?.checkValidity()) {
    return
  }
  
  // Проверяем, что введен тип расхода
  if (!expenseTypeSearch.value || !expenseTypeSearch.value.trim()) {
    error.value = 'Пожалуйста, укажите тип расхода'
    return
  }
  
  // Проверяем сумму
  if (!form.amount || Number(form.amount) <= 0) {
    error.value = 'Пожалуйста, укажите сумму больше 0'
    return
  }
  
  loading.value = true
  error.value = null
  validationErrors.value = null
  
  try {
    // Формируем payload для проектного расхода
    const payload = {
      project_id: Number(props.projectId),
      date: form.date,
      amount: String(Number(form.amount).toFixed(2)),
      expense_type_name: expenseTypeSearch.value.trim(),
      comment: form.comment || '',
      counterparty_id: null, // добавляем, если на бекенде ожидается
    }
    
    console.log('Submitting expense payload:', payload)
    
    let result
    
    if (isEditing.value) {
      // Обновление
      result = await financeStore.updateProjectExpense(props.editingId, payload)
      emit('updated', result)
    } else {
      // Создание
      result = await financeStore.createProjectExpense(payload)
      emit('created', result)
    }
    
    close()
  } catch (e) {
    console.error('Failed to save expense:', e)
    
    // Парсим ошибки валидации с бекенда
    if (e.response?.data) {
      const responseData = e.response.data
      
      if (typeof responseData === 'object') {
        // Если это объект с ошибками полей
        if (responseData.detail) {
          error.value = responseData.detail
        } else if (responseData.errors) {
          validationErrors.value = responseData.errors
        } else {
          // Проверяем каждое поле
          const errors = {}
          let hasErrors = false
          
          for (const [key, value] of Object.entries(responseData)) {
            if (Array.isArray(value)) {
              errors[key] = value
              hasErrors = true
            } else if (typeof value === 'string') {
              errors[key] = [value]
              hasErrors = true
            }
          }
          
          if (hasErrors) {
            validationErrors.value = errors
          } else {
            error.value = JSON.stringify(responseData)
          }
        }
      } else {
        error.value = String(responseData)
      }
    } else {
      error.value = e.message || 'Ошибка при сохранении расхода'
    }
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
  emit('closed')
}

// Watch for modal open
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // Загружаем типы операций если их нет
    if (!operationTypes.value?.length) {
      await financeStore.fetchOperationTypes()
    }
    // Загружаем данные для редактирования
    await loadExpenseForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for editingId change
watch(() => props.editingId, async () => {
  if (props.modelValue) {
    await loadExpenseForEdit()
  }
})
</script>

<style scoped>
/* ... (стили остаются те же) ... */
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
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #C9A86A;
}

.field {
  display: block;
  margin-bottom: 16px;
}

.field span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(208, 210, 213, 0.6);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(208, 210, 213, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: inherit;
  color: #D0D2D5;
  transition: border-color 0.2s;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(208, 210, 213, 0.3);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.15);
}

.field select option {
  background: #1e2126;
  color: #D0D2D5;
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

/* Combobox styles */
.combobox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-wrapper input {
  flex: 1;
  padding-right: 30px;
}

.combobox-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  transition: color 0.2s;
}

.combobox-toggle:hover {
  color: #C9A86A;
}

.combobox-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1e2126;
  border: 1px solid rgba(208, 210, 213, 0.1);
  border-radius: 8px;
  margin: 4px 0 0 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.combobox-suggestions li {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: #D0D2D5;
}

.combobox-suggestions li:hover {
  background: rgba(201, 168, 106, 0.1);
}

.combobox-suggestions .combobox-create-new {
  color: #C9A86A;
  font-weight: 500;
  border-top: 1px solid rgba(201, 168, 106, 0.15);
  cursor: default;
}

.combobox-suggestions .combobox-create-new:hover {
  background: transparent;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.4);
}

.hint.success {
  color: #4ade80;
}

.hint.warning {
  color: #C9A86A;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
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

.btn-ghost {
  background: transparent;
  color: #D0D2D5;
  border-color: rgba(208, 210, 213, 0.2);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 210, 213, 0.3);
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

.alert-error strong {
  color: #f87171;
}

@media (max-width: 640px) {
  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
  }
  
  .field {
    margin-bottom: 12px;
  }
  
  .field input,
  .field select,
  .field textarea {
    padding: 6px 8px;
    font-size: 13px;
  }
}
</style>