<!-- modules/supply/widgets/FactoryPaymentModal/index.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Редактировать оплату фабрике' : 'Оплата фабрике' }}</h2>
            <button class="btn-close" @click="close" type="button">✕</button>
          </div>
          
          <div class="modal-body">
            <p class="muted" v-if="item && !isEditing">
              Товар: {{ nomenclatureName(item.nomenclature) }}<br />
              Фабрика: {{ factoryName(getFactoryId(item)) }}
            </p>
            <p class="muted" v-else-if="isEditing && editingPayment">
              Редактирование оплаты
            </p>
            
            <form ref="formRef" @submit.prevent="submit">
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
                <input 
                  v-model="form.date" 
                  type="date" 
                  required 
                  @focus="$event.target.showPicker?.()"
                  @click="$event.target.showPicker?.()"
                />
              </label>
              
              <label class="field">
                <span>Контрагент (фабрика)</span>
                <select v-model="form.counterparty_id">
                  <option value="">— не указан —</option>
                  <option v-for="f in factories" :key="f.id" :value="f.id">
                    {{ f.name }}
                  </option>
                </select>
              </label>
              
              <label class="field">
                <span>Комментарий</span>
                <textarea 
                  v-model="form.comment" 
                  rows="2"
                  placeholder="Дополнительная информация"
                ></textarea>
              </label>
              
              <div v-if="error" class="alert alert-error">{{ error }}</div>
            </form>
          </div>
          
          <div class="modal-footer">
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="loading"
                @click="submit"
              >
                {{ loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Оплатить') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
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
  item: {
    type: Object,
    default: null,
  },
  editingPayment: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'paid', 'updated'])

// Stores
const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const { factories, loading, error } = storeToRefs(projectsStore)
const { factoryPayments } = storeToRefs(financeStore)

const formRef = ref(null)

const form = reactive({
  id: null,
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
  counterparty_id: '',
})

// Computed
const isEditing = computed(() => !!props.editingPayment)

// --- Вспомогательные функции ---
function getFactoryId(item) {
  const n = projectsStore.nomenclatureById(item.nomenclature)
  return n?.factory ?? null
}

function nomenclatureName(id) {
  return projectsStore.nomenclatureName(id)
}

function factoryName(id) {
  return projectsStore.factoryName(id)
}

// --- Заполнение формы при редактировании ---
function fillFormFromPayment(payment) {
  if (!payment) return
  
  form.id = payment.id
  form.date = payment.date?.slice(0, 10) || ''
  form.amount = payment.amount || ''
  form.counterparty_id = payment.counterparty || payment.counterparty_id || ''
  form.comment = payment.comment || ''
}

// --- Сброс формы ---
function resetForm() {
  const today = new Date().toISOString().slice(0, 10)
  Object.assign(form, {
    id: null,
    amount: '',
    date: today,
    comment: '',
    counterparty_id: '',
  })
  error.value = null
}

// --- Автозаполнение при создании (из item) ---
watch(() => props.item, (item) => {
  if (item && !props.editingPayment) {
    const factoryId = getFactoryId(item)
    form.counterparty_id = factoryId || ''
    
    const cost = Number(item.fixed_cost_price ?? 0)
    const qty = Number(item.quantity ?? 0)
    if (cost && qty) {
      form.amount = String((cost * qty).toFixed(2))
    }
  }
}, { immediate: true })

// --- Заполнение при редактировании ---
watch(() => props.editingPayment, (payment) => {
  if (payment) {
    fillFormFromPayment(payment)
  } else if (!props.item) {
    resetForm()
  }
}, { immediate: true })

// --- При открытии модалки ---
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.editingPayment) {
      fillFormFromPayment(props.editingPayment)
    } else if (props.item) {
      // Автозаполнение уже сработает через watch
    } else {
      resetForm()
    }
  }
}, { immediate: true })

// --- Сабмит ---
async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  // Проверяем сумму
  if (!form.amount || Number(form.amount) <= 0) {
    error.value = 'Пожалуйста, укажите сумму больше 0'
    return
  }
  
  const payload = {
    project_id: props.projectId,
    amount: String(Number(form.amount).toFixed(2)),
    date: form.date,
    counterparty_id: form.counterparty_id ? Number(form.counterparty_id) : null,
    comment: form.comment || null,
  }
  
  try {
    if (isEditing.value && form.id) {
      await financeStore.updateFactoryPayment(form.id, payload)
      emit('updated')
    } else {
      await projectsStore.createFactoryPayment(payload)
      emit('paid')
    }
    close()
  } catch (e) {
    console.error('Failed to save factory payment:', e)
    error.value = e.message || 'Ошибка при сохранении'
  }
}

function close() {
  emit('update:modelValue', false)
  emit('closed')
}

function handleAfterLeave() {
  resetForm()
}
</script>

<style scoped>
/* ============================================
   АНИМАЦИИ ПОЯВЛЕНИЯ/ИСЧЕЗНОВЕНИЯ
   ============================================ */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s ease;
}

.modal-enter-from .modal {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.modal-leave-to .modal {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

/* ============================================
   МОДАЛЬНОЕ ОКНО - ПОЛНЫЙ ЭКРАН
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
}

.modal {
  background: #FFFFFF;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* ============================================
   ЗАГОЛОВОК
   ============================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2C3E50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(26, 26, 26, 0.4);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1A1A1A;
}

/* ============================================
   ТЕЛО (СКРОЛЛИТСЯ)
   ============================================ */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

/* ============================================
   ФУТЕР С КНОПКАМИ
   ============================================ */
.modal-footer {
  padding: 16px 24px 24px 24px;
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #FFFFFF;
}

/* ============================================
   ПОЛЯ ФОРМЫ
   ============================================ */
.field {
  display: block;
  margin-bottom: 16px;
}

.field:last-of-type {
  margin-bottom: 0;
}

.field span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(26, 26, 26, 0.6);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(26, 26, 26, 0.3);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.field select option {
  background: #FFFFFF;
  color: #1A1A1A;
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

/* ============================================
   ИНФО-БЛОК
   ============================================ */
.muted {
  color: rgba(26, 26, 26, 0.5);
  font-size: 14px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #F8F9FA;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  line-height: 1.6;
}

/* ============================================
   КНОПКИ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2C3E50;
  color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
  background: #34495E;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.25);
}

.btn-ghost {
  background: transparent;
  color: #1A1A1A;
  border-color: rgba(0, 0, 0, 0.12);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
}

/* ============================================
   АЛЕРТЫ
   ============================================ */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 12px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.06);
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.1);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 640px) {
  .modal-backdrop {
    padding: 10px;
  }
  
  .modal {
    max-height: 95vh;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 16px 16px 0 16px;
  }
  
  .modal-header h2 {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-footer {
    padding: 12px 16px 16px 16px;
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
  .modal-backdrop {
    padding: 8px;
  }
  
  .modal-header h2 {
    font-size: 16px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .modal-footer {
    padding: 10px 12px 12px 12px;
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
  
  .btn {
    padding: 10px;
    font-size: 14px;
  }
}
</style>