<!-- modules/supply/widgets/FactoryFormModal/index.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Новая фабрика</h2>
      <form ref="formRef" @submit.prevent="submit">
        <label class="field">
          <span>Название *</span>
          <input v-model="form.name" required maxlength="255" />
        </label>
        
        <label class="field">
          <span>Адрес</span>
          <input v-model="form.address" />
        </label>
        
        <label class="field">
          <span>Контакты</span>
          <input v-model="form.contacts" />
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            Создать
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'created'])

const store = useSupplyStore()
const { loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  name: '',
  address: '',
  contacts: '',
})

async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  try {
    const created = await store.createFactory({
      name: form.name,
      address: form.address || '',
      contacts: form.contacts || '',
    })
    emit('created', created)
    close()
  } catch (e) {
    console.error('Failed to create factory:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  Object.assign(form, { name: '', address: '', contacts: '' })
}
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

.field input {
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

.field input::placeholder {
  color: rgba(208, 210, 213, 0.3);
}

.field input:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.15);
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
  
  .field input {
    padding: 6px 8px;
    font-size: 13px;
  }
}
</style>