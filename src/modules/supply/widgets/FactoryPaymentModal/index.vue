<!-- modules/supply/widgets/FactoryPaymentModal/index.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Оплата фабрике</h2>
      <p class="muted" v-if="item">
        Товар: {{ nomenclatureName(item.nomenclature) }}<br />
        Фабрика: {{ factoryName(getFactoryId(item)) }}
      </p>
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
          <textarea v-model="form.comment" rows="2"></textarea>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            Оплатить
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'  // 👈 как в старом коде
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
  projectId: {
    type: Number,
    required: true,
  },
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'paid'])

// Используем projectsStore как в старом коде
const store = useProjectsStore()
const { factories, loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
  counterparty_id: '',
})

// --- Вспомогательные функции (как в старом коде) ---
function getFactoryId(item) {
  const n = store.nomenclatureById(item.nomenclature)
  return n?.factory ?? null
}

function nomenclatureName(id) {
  return store.nomenclatureName(id)
}

function factoryName(id) {
  return store.factoryName(id)
}

// --- Автозаполнение (как в старом коде) ---
watch(() => props.item, (item) => {
  if (item) {
    const factoryId = getFactoryId(item)
    form.counterparty_id = factoryId || ''
    
    const cost = Number(item.fixed_cost_price ?? 0)
    const qty = Number(item.quantity ?? 0)
    if (cost && qty) {
      form.amount = String((cost * qty).toFixed(2))
    }
  }
}, { immediate: true })

// --- Сабмит (как в старом коде) ---
async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  const payload = {
    project_id: props.projectId,
    amount: String(form.amount),
    date: form.date,
    counterparty_id: form.counterparty_id ? Number(form.counterparty_id) : null,
    comment: form.comment || null,
  }
  
  try {
    await store.createFactoryPayment(payload)  // 👈 как в старом коде
    emit('paid')
    close()
  } catch (e) {
    console.error('Failed to create factory payment:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  Object.assign(form, {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    comment: '',
    counterparty_id: '',
  })
}
</script>

<style>
/* ============================================
   СТИЛИ ДЛЯ FactoryPaymentModal
   ============================================ */

/* Модальное окно */
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

/* Текст */
.muted {
  color: rgba(208, 210, 213, 0.6);
  font-size: 14px;
  margin-bottom: 16px;
}

/* Поля формы */
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

/* Кнопки в модалке */
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

/* Алерт ошибки */
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

/* Адаптивность */
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