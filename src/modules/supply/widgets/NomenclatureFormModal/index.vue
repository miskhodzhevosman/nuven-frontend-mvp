<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Новый товар</h2>
      <form ref="formRef" @submit.prevent="submit">
        <label class="field">
          <span>Название *</span>
          <input v-model="form.name" required maxlength="255" />
        </label>
        
        <label class="field">
          <span>Техническое название</span>
          <input v-model="form.technical_name" maxlength="255" />
        </label>
        
        <label class="field">
          <span>Тип *</span>
          <select v-model="form.type">
            <option value="PRODUCT">Товар</option>
            <option value="SERVICE">Услуга</option>
          </select>
        </label>
        
        <label class="field">
          <span>Фабрика</span>
          <div class="row">
            <select v-model="form.factory">
              <option value="">— не указана —</option>
              <option v-for="f in factories" :key="f.id" :value="f.id">
                {{ f.name }}
              </option>
            </select>
            <button 
              type="button" 
              class="btn btn-ghost" 
              @click="openFactoryModal"
            >
              + Новая фабрика
            </button>
          </div>
          <!-- Отладочная информация -->
          <div v-if="factories.length === 0" style="color: #999; font-size: 12px; margin-top: 4px;">
            Нет доступных фабрик. Загрузка...
          </div>
        </label>
        
        <label class="field">
          <span>Текущая себестоимость</span>
          <input v-model="form.current_cost_price" type="number" step="0.01" />
        </label>
        
        <label class="field">
          <span>Текущая цена продажи</span>
          <input v-model="form.current_sale_price" type="number" step="0.01" />
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
    
    <!-- Вложенная модалка фабрики -->
    <FactoryFormModal 
      v-model="showFactoryModal" 
      @created="onFactoryCreated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useSupplyStore } from '../../store'
import { storeToRefs } from 'pinia'
import FactoryFormModal from '../FactoryFormModal/index.vue'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'created'])

const store = useSupplyStore()
const { factories, loading, error } = storeToRefs(store)

const formRef = ref(null)
const showFactoryModal = ref(false)

const form = reactive({
  name: '',
  technical_name: '',
  type: 'PRODUCT',
  article: '',
  factory: '',
  current_cost_price: '',
  current_sale_price: '',
})

// Загружаем фабрики при открытии модалки
watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    await store.fetchFactories()
  }
}, { immediate: true })

async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  const payload = {
    name: form.name,
    technical_name: form.technical_name || '',
    type: form.type,
    article: form.article || null,
    factory: form.factory ? Number(form.factory) : null,
    current_cost_price: form.current_cost_price ? String(form.current_cost_price) : null,
    current_sale_price: form.current_sale_price ? String(form.current_sale_price) : null,
  }
  
  try {
    const created = await store.createNomenclature(payload)
    emit('created', created)
    close()
  } catch (e) {
    console.error('Failed to create nomenclature:', e)
  }
}

function openFactoryModal() {
  showFactoryModal.value = true
}

function onFactoryCreated(factory) {
  // Автоматически выбираем созданную фабрику
  form.factory = factory.id
  // Обновляем список фабрик
  store.fetchFactories()
}

function close() {
  emit('update:modelValue', false)
  // Сбрасываем форму
  Object.assign(form, {
    name: '',
    technical_name: '',
    type: 'PRODUCT',
    factory: '',
    current_cost_price: '',
    current_sale_price: '',
  })
}
</script>



<style scoped>
/* ============================================
   СВЕТЛЫЕ СТИЛИ ДЛЯ NomenclatureFormModal
   ============================================ */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #2C3E50;
}

/* ============================================
   ПОЛЯ ФОРМ
   ============================================ */
.field {
  display: block;
  margin-bottom: 16px;
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
   ROW (для полей с кнопкой "+")
   ============================================ */
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row > select {
  flex: 1;
}

/* ============================================
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
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