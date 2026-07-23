<!-- modules/app/widgets/ProjectExpenses/components/ExpenseFormModal.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Проектный расход</h2>
      <form ref="formRef" @submit.prevent="submit">
        <label class="field">
          <span>Сумма *</span>
          <input 
            v-model="form.amount" 
            type="number" 
            step="0.01" 
            required 
          />
        </label>
        
        <label class="field">
          <span>Дата *</span>
          <input 
            v-model="form.date" 
            type="date" 
            required 
            @focus="$event.target.showPicker?.()"
            @click="$event.target.showPicker?.()"
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
                @mousedown.prevent="createNewExpenseType"
                class="combobox-create-new"
              >
                ✚ Создать "{{ expenseTypeSearch }}"
              </li>
            </ul>
          </div>
          <small v-if="expenseTypeSearch && !isExpenseTypeExists" class="hint">
            Будет создан новый тип расхода "{{ expenseTypeSearch }}"
          </small>
          <small v-else-if="selectedExpenseType" class="hint success">
            Выбран тип: {{ selectedExpenseType.name }}
          </small>
        </label>

        <label class="field">
          <span>Контрагент</span>
          <select v-model="form.counterparty_id">
            <option value="">— не указан —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </label>
        
        <label class="field">
          <span>Комментарий</span>
          <textarea v-model="form.comment" rows="2"></textarea>
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="loading || !form.expense_type_name"
          >
            Создать
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'created'])

const store = useProjectsStore()
const { clients, loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
  counterparty_id: '',
  expense_type_name: '',
})

// Expense type autocomplete
const expenseTypeSearch = ref('')
const showExpenseTypeSuggestions = ref(false)
const selectedExpenseType = ref(null)

const filteredExpenseTypes = computed(() => {
  if (!expenseTypeSearch.value) return store.expenseTypes || []
  const search = expenseTypeSearch.value.toLowerCase().trim()
  return (store.expenseTypes || [])
    .filter(t => t.name.toLowerCase().includes(search))
    .slice(0, 10)
})

const isExpenseTypeExists = computed(() => {
  if (!expenseTypeSearch.value) return false
  return (store.expenseTypes || []).some(t => 
    t.name.toLowerCase() === expenseTypeSearch.value.toLowerCase().trim()
  )
})

// --- Expense type methods (как в старом коде) ---
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
      if (!isExpenseTypeExists.value) {
        form.expense_type_name = expenseTypeSearch.value.trim()
      } else {
        const found = (store.expenseTypes || []).find(t => 
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
}

function createNewExpenseType() {
  if (expenseTypeSearch.value && expenseTypeSearch.value.trim()) {
    const name = expenseTypeSearch.value.trim()
    selectedExpenseType.value = { id: 'new', name }
    form.expense_type_name = name
    showExpenseTypeSuggestions.value = false
  }
}

// --- Submit (как в старом коде) ---
async function submit() {
  if (!form.expense_type_name) {
    error.value = 'Пожалуйста, укажите тип расхода'
    return
  }
  if (!formRef.value?.checkValidity()) return
  
  const payload = {
    project_id: props.projectId,
    amount: String(form.amount),
    date: form.date,
    expense_type_name: form.expense_type_name,
    counterparty_id: form.counterparty_id ? Number(form.counterparty_id) : null,
    comment: form.comment || null,
  }
  
  try {
    await store.createProjectExpense(payload)
    emit('created')
    close()
  } catch (e) {
    console.error('Failed to create project expense:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  Object.assign(form, {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    comment: '',
    counterparty_id: '',
    expense_type_name: '',
  })
  expenseTypeSearch.value = ''
  selectedExpenseType.value = null
  showExpenseTypeSuggestions.value = false
}
</script>

<style scoped>
/* ============================================
   СТИЛИ ДЛЯ ExpenseFormModal
   ============================================ */

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
}

.combobox-suggestions .combobox-create-new:hover {
  background: rgba(201, 168, 106, 0.1);
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