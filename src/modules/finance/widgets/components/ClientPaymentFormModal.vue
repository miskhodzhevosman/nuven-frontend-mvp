<!-- modules/finance/widgets/ClientPayments/components/ClientPaymentFormModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Редактировать оплату клиента' : 'Новая оплата клиента' }}</h2>
            <button class="btn-close" @click="close" type="button">✕</button>
          </div>
          
          <div class="modal-body">
            <form ref="formRef" @submit.prevent="submit">
              <label class="field">
                <span>Клиент</span>
                <div class="client-info">
                  <span class="client-name">{{ clientName || '—' }}</span>
                  <small class="hint">Оплата от клиента, прикрепленного к проекту</small>
                </div>
              </label>
              
              <label class="field">
                <span>Сумма *</span>
                <input 
                  v-model="form.amount" 
                  type="number" 
                  step="0.01" 
                  min="0" 
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
                />
              </label>
              
              <label class="field">
                <span>Комментарий</span>
                <textarea 
                  v-model="form.comment" 
                  rows="3" 
                  placeholder="Дополнительная информация"
                ></textarea>
              </label>
              
              <div v-if="error" class="alert alert-error">{{ error }}</div>
              <div v-if="validationErrors" class="alert alert-error">
                <div v-for="(errors, field) in validationErrors" :key="field">
                  <strong>{{ field }}:</strong> {{ errors.join(', ') }}
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="loading || !form.amount || !form.date || !clientId"
                @click="submit"
              >
                {{ loading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать') }}
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
import { useFinanceStore } from '@/modules/finance/store'
import { useProjectsStore } from '@/modules/projects/store'
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
const projectsStore = useProjectsStore()
const { clientPayments, loading } = storeToRefs(financeStore)
const { currentProject, clients } = storeToRefs(projectsStore)

const formRef = ref(null)
const error = ref(null)
const validationErrors = ref(null)

const form = reactive({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
})

// Computed
const isEditing = computed(() => !!props.editingId)

// ID клиента из проекта
const clientId = computed(() => {
  if (currentProject.value?.client) {
    return typeof currentProject.value.client === 'object' 
      ? currentProject.value.client.id 
      : currentProject.value.client
  }
  return null
})

// Имя клиента
const clientName = computed(() => {
  if (currentProject.value?.client) {
    if (typeof currentProject.value.client === 'object') {
      return currentProject.value.client.name
    }
    const client = clients.value?.find(c => c.id === currentProject.value.client)
    return client?.name || 'Клиент #' + currentProject.value.client
  }
  return null
})

// Reset form
function resetForm() {
  const today = new Date().toISOString().slice(0, 10)
  Object.assign(form, {
    amount: '',
    date: today,
    comment: '',
  })
  error.value = null
  validationErrors.value = null
}

// Load payment for editing
async function loadPaymentForEdit() {
  if (!props.editingId) {
    resetForm()
    return
  }
  
  try {
    let payment = clientPayments.value?.find(p => p.id === props.editingId)
    
    if (!payment) {
      payment = await financeStore.fetchClientPayment(props.editingId)
    }
    
    if (payment) {
      form.date = payment.date?.slice(0, 10) || ''
      form.amount = payment.amount || ''
      form.comment = payment.comment || ''
    }
  } catch (e) {
    console.error('Failed to load payment:', e)
    error.value = 'Не удалось загрузить данные оплаты'
  }
}

// Submit
async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  if (!form.amount || Number(form.amount) <= 0) {
    error.value = 'Пожалуйста, укажите сумму больше 0'
    return
  }
  
  if (!clientId.value) {
    error.value = 'У проекта не указан клиент'
    return
  }
  
  loading.value = true
  error.value = null
  validationErrors.value = null
  
  try {
    const payload = {
      project_id: Number(props.projectId),
      date: form.date,
      amount: String(Number(form.amount).toFixed(2)),
      counterparty_id: Number(clientId.value),
      comment: form.comment || '',
    }
    
    console.log('Submitting client payment payload:', payload)
    
    let result
    
    if (isEditing.value) {
      result = await financeStore.updateClientPayment(props.editingId, payload)
      emit('updated', result)
    } else {
      result = await financeStore.createClientPayment(payload)
      emit('created', result)
    }
    
    close()
  } catch (e) {
    console.error('Failed to save client payment:', e)
    
    if (e.response?.data) {
      const data = e.response.data
      if (typeof data === 'object') {
        if (data.detail) {
          error.value = data.detail
        } else if (data.errors) {
          validationErrors.value = data.errors
        } else {
          const errors = {}
          let hasErrors = false
          for (const [key, value] of Object.entries(data)) {
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
            error.value = 'Ошибка при сохранении'
          }
        }
      } else {
        error.value = String(data)
      }
    } else {
      error.value = e.message || 'Ошибка при сохранении'
    }
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
  emit('closed')
}

function handleAfterLeave() {
  resetForm()
}

// Watch for modal open
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    if (!currentProject.value || currentProject.value.id !== props.projectId) {
      await projectsStore.fetchProject(props.projectId)
    }
    await loadPaymentForEdit()
  }
}, { immediate: true })
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
.field textarea:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

/* ============================================
   ИНФОРМАЦИЯ О КЛИЕНТЕ
   ============================================ */
.client-info {
  background: #F8F9FA;
  border: 1px solid rgba(44, 62, 80, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
}

.client-name {
  font-size: 15px;
  color: #2C3E50;
  font-weight: 500;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(26, 26, 26, 0.4);
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

.alert-error strong {
  color: #DC2626;
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