<!-- src/modules/supply/components/FactoryViewModal.vue -->
<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal modal--large">
      <div class="modal__header">
        <h2 class="modal__title">Просмотр фабрики</h2>
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

      <div class="modal__body">
        <!-- Вкладка "Основная информация" -->
        <div v-if="activeTab === 'info'">
          <div class="view-item">
            <label class="view-item__label">ID</label>
            <div class="view-item__value">{{ factory.id }}</div>
          </div>

          <div class="view-item">
            <label class="view-item__label">Название</label>
            <div class="view-item__value">{{ factory.name }}</div>
          </div>

          <div class="view-item">
            <label class="view-item__label">Адрес</label>
            <div class="view-item__value">{{ factory.address || 'Не указан' }}</div>
          </div>

          <div class="view-item">
            <label class="view-item__label">Контакты</label>
            <div class="view-item__value">{{ factory.contacts || 'Не указаны' }}</div>
          </div>
        </div>

        <!-- Вкладка "Файлы" -->
        <div v-if="activeTab === 'files'" class="files-tab">
          <FactoryFileManager
            :factory-id="factory.id"
          />
        </div>
      </div>

      <div class="modal__footer">
        <button @click="close" class="btn btn--primary">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FactoryFileManager from './FactoryFileManager.vue'

const props = defineProps({
  factory: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])
const activeTab = ref('info')

const close = () => {
  emit('close')
}
</script>

<style scoped>
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

.view-item {
  margin-bottom: 20px;
}

.view-item__label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #999;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.view-item__value {
  font-size: 16px;
  color: #333;
  padding: 8px 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn--primary {
  background: #1890ff;
  color: white;
}

.btn--primary:hover {
  background: #40a9ff;
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