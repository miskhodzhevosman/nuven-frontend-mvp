<!-- src/modules/supply/components/FactoryDeleteModal.vue -->
<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal modal--danger">
      <div class="modal__header">
        <h2 class="modal__title">Подтверждение удаления</h2>
        <button @click="close" class="modal__close-btn">×</button>
      </div>

      <div class="modal__body">
        <div class="delete-icon">⚠️</div>
        <p class="delete-message">
          Вы уверены, что хотите удалить фабрику
          <strong>"{{ factory.name }}"</strong>?
        </p>
        <p class="delete-warning">
          Это действие невозможно отменить. Все связанные данные будут удалены.
        </p>
      </div>

      <div class="modal__footer">
        <button @click="close" class="btn btn--secondary" :disabled="deleting">
          Отмена
        </button>
        <button @click="handleDelete" class="btn btn--danger" :disabled="deleting">
          {{ deleting ? 'Удаление...' : 'Удалить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'

const props = defineProps({
  factory: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'deleted'])
const store = useSupplyStore()

const deleting = ref(false)

const handleDelete = async () => {
  deleting.value = true
  try {
    await store.deleteFactory(props.factory.id)
    emit('deleted')
  } catch (error) {
    console.error('Error deleting factory:', error)
  } finally {
    deleting.value = false
  }
}

const close = () => {
  if (!deleting.value) {
    emit('close')
  }
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
  max-width: 450px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s;
}

.modal--danger .modal__header {
  border-bottom-color: #ffccc7;
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
  color: #ff4d4f;
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

.modal__body {
  padding: 24px;
  text-align: center;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.delete-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.delete-message {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.delete-warning {
  font-size: 14px;
  color: #999;
  margin: 0;
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

.btn--danger {
  background: #ff4d4f;
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background: #ff7875;
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