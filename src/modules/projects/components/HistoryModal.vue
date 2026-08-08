<script setup>
const props = defineProps({
  project: {
    type: Object,
    default: null
  },
  historyData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  clients: {
    type: Array,
    default: () => []
  },
  statuses: {
    type: Array,
    default: () => []
  },
  managers: {
    type: Array,
    default: () => []
  },
  locations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

function getFieldDisplayValue(field, value) {
  if (value === null || value === undefined || value === '') return '—'
  
  if (field === 'client_id') {
    const client = props.clients.find(c => c.id === Number(value))
    return client ? client.name : `Клиент #${value}`
  }
  
  if (field === 'status_id') {
    const status = props.statuses.find(s => s.id === Number(value))
    return status ? status.name : `Статус #${value}`
  }
  
  if (field === 'tech_manager_id') {
    const manager = props.managers.find(m => m.id === Number(value))
    if (manager) {
      return getManagerFullName(manager) || manager.username || `Менеджер #${value}`
    }
    return `Менеджер #${value}`
  }
  
  if (field === 'location_id') {
    const location = props.locations.find(l => l.id === Number(value))
    return location ? location.name : `Локация #${value}`
  }
  
  if (field === 'created_at' && value) {
    return new Date(value).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return value
}

function getFieldLabel(field) {
  const labels = {
    'name': 'Название',
    'client_id': 'Клиент',
    'tech_manager_id': 'Тех. менеджер',
    'location_id': 'Локация',
    'created_at': 'Дата создания',
    'status_id': 'Статус'
  }
  return labels[field] || field
}

function getManagerFullName(manager) {
  if (!manager) return ''
  const parts = []
  if (manager.last_name) parts.push(manager.last_name)
  if (manager.first_name) parts.push(manager.first_name)
  if (manager.patronymic) parts.push(manager.patronymic)
  return parts.join(' ') || manager.username || 'Без имени'
}

function getChanges(current, previous) {
  if (!previous) return null
  
  const changes = []
  const fields = ['name', 'client_id', 'tech_manager_id', 'location_id', 'created_at', 'status_id']
  
  for (const field of fields) {
    const oldValue = previous[field]
    const newValue = current[field]
    
    if (oldValue !== newValue) {
      changes.push({
        field: field,
        label: getFieldLabel(field),
        oldValue: getFieldDisplayValue(field, oldValue),
        newValue: getFieldDisplayValue(field, newValue)
      })
    }
  }
  
  return changes
}

function getHistoryTypeLabel(type) {
  const labels = {
    '+': 'Создание',
    '~': 'Изменение',
    '-': 'Удаление'
  }
  return labels[type] || type
}

function getHistoryTypeClass(type) {
  const classes = {
    '+': 'history-created',
    '~': 'history-changed',
    '-': 'history-deleted'
  }
  return classes[type] || ''
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>История изменений</h2>
        <button class="btn btn-ghost btn-sm" @click="emit('close')">✕</button>
      </div>
      
      <div v-if="project" class="history-project-info">
        <strong>{{ project.name }}</strong>
        <span class="muted">ID: {{ project.id }}</span>
      </div>
      
      <div v-if="loading" class="state">Загрузка истории...</div>
      
      <div v-else-if="historyData.length === 0" class="state muted">
        История изменений отсутствует
      </div>
      
      <div v-else class="history-timeline">
        <div 
          v-for="(record, index) in historyData" 
          :key="record.history_id"
          class="history-item"
          :class="getHistoryTypeClass(record.history_type)"
        >
          <div class="history-header">
            <span class="history-type" :class="getHistoryTypeClass(record.history_type)">
              {{ getHistoryTypeLabel(record.history_type) }}
            </span>
            <span class="history-date">{{ new Date(record.history_date).toLocaleString('ru-RU') }}</span>
            <span class="history-user" v-if="record.history_user">
              {{ record.history_user }}
            </span>
          </div>
          
          <div class="history-changes">
            <!-- Создание -->
            <div v-if="record.history_type === '+'" class="history-change">
              <div class="history-change-title">Создан проект</div>
              <div class="history-change-values">
                <div class="history-value">
                  <span class="history-label">Название:</span>
                  <span>{{ record.name }}</span>
                </div>
                <div class="history-value">
                  <span class="history-label">Клиент:</span>
                  <span>{{ getFieldDisplayValue('client_id', record.client_id) }}</span>
                </div>
                <div class="history-value">
                  <span class="history-label">Статус:</span>
                  <span>{{ getFieldDisplayValue('status_id', record.status_id) }}</span>
                </div>
                <div class="history-value" v-if="record.tech_manager_id">
                  <span class="history-label">Менеджер:</span>
                  <span>{{ getFieldDisplayValue('tech_manager_id', record.tech_manager_id) }}</span>
                </div>
                <div class="history-value" v-if="record.location_id">
                  <span class="history-label">Локация:</span>
                  <span>{{ getFieldDisplayValue('location_id', record.location_id) }}</span>
                </div>
                <div class="history-value" v-if="record.created_at">
                  <span class="history-label">Дата создания:</span>
                  <span>{{ getFieldDisplayValue('created_at', record.created_at) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Изменение -->
            <div v-else-if="record.history_type === '~'" class="history-change">
              <div class="history-change-title">Изменены поля</div>
              <div class="history-change-values">
                <template v-if="index < historyData.length - 1">
                  <div 
                    v-for="change in getChanges(record, historyData[index + 1])" 
                    :key="change.field"
                    class="history-change-item"
                  >
                    <div class="history-change-field">{{ change.label }}</div>
                    <div class="history-change-diff">
                      <span class="history-old-value">{{ change.oldValue }}</span>
                      <span class="history-arrow">→</span>
                      <span class="history-new-value">{{ change.newValue }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="history-value">
                    <span class="history-label">Название:</span>
                    <span>{{ record.name }}</span>
                  </div>
                  <div class="history-value">
                    <span class="history-label">Клиент:</span>
                    <span>{{ getFieldDisplayValue('client_id', record.client_id) }}</span>
                  </div>
                  <div class="history-value">
                    <span class="history-label">Статус:</span>
                    <span>{{ getFieldDisplayValue('status_id', record.status_id) }}</span>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Удаление -->
            <div v-else-if="record.history_type === '-'" class="history-change">
              <div class="history-change-title">Проект удален</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-primary" @click="emit('close')">Закрыть</button>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* ============================================
   МОДАЛЬНЫЕ ОКНА
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
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

.modal-lg {
  max-width: 800px;
  width: 90%;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #2C3E50;
}

/* ============================================
   ХЕДЕР МОДАЛКИ
   ============================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* ============================================
   ИНФОРМАЦИЯ О ПРОЕКТЕ
   ============================================ */
.history-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
}

.history-project-info strong {
  color: #2C3E50;
}

.muted {
  color: rgba(26, 26, 26, 0.5);
  font-size: 14px;
}

/* ============================================
   ТАЙМЛАЙН ИСТОРИИ
   ============================================ */
.history-timeline {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px 0;
}

.history-item {
  border-left: 3px solid #e0e0e0;
  padding: 12px 20px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  position: relative;
}

.history-item.history-created {
  border-left-color: #28a745;
  background: #f0f9f0;
}

.history-item.history-changed {
  border-left-color: #ffc107;
  background: #fff9e6;
}

.history-item.history-deleted {
  border-left-color: #dc3545;
  background: #fdf0f0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.history-type {
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
  background: #e0e0e0;
  color: #000000;
}

.history-type.history-created {
  background: #28a745;
  color: #ffffff;
}

.history-type.history-changed {
  background: #ffc107;
  color: #000000;
}

.history-type.history-deleted {
  background: #dc3545;
  color: #ffffff;
}

.history-date {
  color: #000000;
  font-size: 13px;
}

.history-user {
  color: #000000;
  font-size: 13px;
  margin-left: auto;
}

.history-changes {
  padding-left: 4px;
}

.history-change-field {
  font-weight: 500;
  margin-bottom: 6px;
  color: #000000;
}

.history-change-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-value {
  display: flex;
  gap: 8px;
  font-size: 14px;
  padding: 2px 0;
}

.history-label {
  color: #000000;
  min-width: 140px;
  font-weight: 500;
}

.history-change-item {
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.history-change-item:last-child {
  border-bottom: none;
}

.history-change-diff {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.history-old-value {
  color: #DC2626;
  text-decoration: line-through;
  opacity: 0.7;
}

.history-new-value {
  color: #16A34A;
  font-weight: 500;
}

.history-arrow {
  color: rgba(26, 26, 26, 0.3);
  font-weight: 300;
}

.history-change-title {
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 8px;
}

/* ============================================
   СОСТОЯНИЯ
   ============================================ */
.state {
  padding: 40px;
  text-align: center;
  color: rgba(26, 26, 26, 0.35);
  font-size: 16px;
}

.state.muted {
  color: rgba(26, 26, 26, 0.35);
}

/* ============================================
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.25);
}

.btn-ghost {
  background: transparent;
  color: #1A1A1A;
  border-color: rgba(0, 0, 0, 0.12);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(44, 62, 80, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 62, 80, 0.35);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }
  
  .history-value {
    flex-direction: column;
    gap: 2px;
  }
  
  .history-label {
    min-width: auto;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-user {
    margin-left: 0;
  }
  
  .history-change-diff {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
    margin: 4px;
  }
  
  .history-item {
    padding: 8px 12px;
  }
}
</style>