<!-- src/modules/supply/components/FactoryEditModal.vue -->
<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal modal--large">
      <div class="modal__header">
        <h2 class="modal__title">Редактирование фабрики</h2>
        <button @click="close" class="modal__close-btn">×</button>
      </div>

      <div class="modal__tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          Основная информация
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'files' }"
          @click="activeTab = 'files'"
        >
          Файлы
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal__form">
        <div class="modal__body">
          <!-- Вкладка "Основная информация" -->
          <div v-if="activeTab === 'info'">
            <div class="form-group">
              <label for="name" class="form-label">Название *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="form-input"
                :class="{ 'form-input--error': errors.name }"
                required
                placeholder="Введите название фабрики"
              />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label for="address" class="form-label">Адрес</label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                class="form-input"
                placeholder="Введите адрес"
              />
            </div>

            <div class="form-group">
              <label for="contacts" class="form-label">Контакты</label>
              <input
                id="contacts"
                v-model="form.contacts"
                type="text"
                class="form-input"
                placeholder="Введите контактную информацию"
              />
            </div>
          </div>

          <!-- Вкладка "Файлы" -->
          <div v-if="activeTab === 'files'" class="files-tab">
            <FactoryFileManager
              :factory-id="props.factory.id"
              @file-uploaded="onFilesChange"
              @file-deleted="onFilesChange"
              @file-updated="onFilesChange"
            />
          </div>
        </div>

        <div class="modal__footer">
          <button type="button" @click="close" class="btn btn--secondary">
            Отмена
          </button>
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            {{ submitting ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'
import FactoryFileManager from './FactoryFileManager.vue'

const props = defineProps({
  factory: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])
const store = useSupplyStore()

const activeTab = ref('info')

const form = reactive({
  name: '',
  address: '',
  contacts: ''
})

const errors = reactive({
  name: ''
})

const submitting = ref(false)

// Инициализация формы
watch(() => props.factory, (factory) => {
  if (factory) {
    form.name = factory.name || ''
    form.address = factory.address || ''
    form.contacts = factory.contacts || ''
  }
}, { immediate: true })

const validate = () => {
  errors.name = ''
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Название обязательно для заполнения'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    await store.updateFactory(props.factory.id, form)
    emit('updated')
  } catch (error) {
    console.error('Error updating factory:', error)
  } finally {
    submitting.value = false
  }
}

const close = () => {
  if (!submitting.value) {
    emit('close')
  }
}

const onFilesChange = () => {
  // Файлы обновлены - можно обновить данные фабрики если нужно
  console.log('Files changed')
}
</script>

<style scoped>
/* Обновленные стили */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s;
}

.modal--large {
  max-width: 700px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal__close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  transition: color 0.3s;
}

.modal__close-btn:hover {
  color: #333;
}

.modal__tabs {
  display: flex;
  gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #1890ff;
}

.tab-btn--active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.files-tab {
  min-height: 200px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-input--error {
  border-color: #ff4d4f;
}

.form-input--error:focus {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

.form-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #ff4d4f;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #1890ff;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn--secondary {
  background: #f5f5f5;
  color: #333;
}

.btn--secondary:hover:not(:disabled) {
  background: #e8e8e8;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>