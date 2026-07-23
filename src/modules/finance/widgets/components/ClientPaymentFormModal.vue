<!-- modules/finance/widgets/ClientPayments/components/ClientPaymentFormModal.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>{{ isEditing ? 'Редактировать оплату клиента' : 'Новая оплата клиента' }}</h2>
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
          <textarea v-model="form.comment" rows="3" placeholder="Дополнительная информация"></textarea>
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="loading || !form.amount || !form.date || !clientId"
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
  // Если есть currentProject и у него есть client
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
    // Если это ID, ищем в списке clients
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
      counterparty_id: Number(clientId.value), // автоматически из проекта
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
  resetForm()
  emit('closed')
}

// Watch for modal open
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // Загружаем проект если его нет
    if (!currentProject.value || currentProject.value.id !== props.projectId) {
      await projectsStore.fetchProject(props.projectId)
    }
    await loadPaymentForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

<style scoped>
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
.field textarea:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.15);
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

.client-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
}

.client-name {
  font-size: 15px;
  color: #C9A86A;
  font-weight: 500;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.4);
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
  .field textarea {
    padding: 6px 8px;
    font-size: 13px;
  }
}
</style>