<script setup>
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'
import { ref } from 'vue'

const store = useProjectsStore()
const { statuses } = storeToRefs(store)

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['open', 'history'])

// Состояние для уведомлений о копировании
const copiedStates = ref({})

// Генерируем ссылку для отслеживания
const getTrackLink = (hashid) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/track/${hashid}`
}

// Копируем ссылку
const copyTrackLink = async (hashid, event) => {
  event.stopPropagation()
  const link = getTrackLink(hashid)
  
  try {
    await navigator.clipboard.writeText(link)
    showCopiedFeedback(hashid)
  } catch (err) {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = link
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showCopiedFeedback(hashid)
  }
}

// Показываем уведомление о копировании
const showCopiedFeedback = (hashid) => {
  // Устанавливаем состояние для конкретного проекта
  copiedStates.value[hashid] = true
  
  // Автоматически скрываем через 2 секунды
  setTimeout(() => {
    copiedStates.value[hashid] = false
  }, 2000)
}
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Клиент</th>
          <th>Статус</th>
          <th>Локация</th>
          <th>Создан</th>
          <th></th>
          <th class="actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in projects" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ store.clientName(p.client) }}</td>
          <td>
            <span class="status-badge" :style="{ backgroundColor: p.status_color || '#16181C' }">
              {{ store.statusName(p.status) }}
            </span>
          </td>
          <td>{{ p.full_location_name || '—' }}</td>
          <td>{{ p.created_at?.slice(0, 10) }}</td>
          <td>
            <div class="track-link-cell">
              <button 
                class="btn btn-ghost btn-sm btn-copy" 
                @click.stop="copyTrackLink(p.hashid, $event)"
                :class="{ 'copied': copiedStates[p.hashid] }"
                title="Скопировать ссылку для клиента"
              >
                <span class="btn-content">
                  <svg v-if="!copiedStates[p.hashid]" class="icon-share" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <svg v-else class="icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ copiedStates[p.hashid] ? 'Скопировано!' : 'Поделиться проектом' }}
                </span>
              </button>
            </div>
          </td>
          <td class="actions">
            <button class="btn btn-ghost btn-sm" @click.stop="emit('open', p.id)">Открыть</button>
            <button class="btn btn-ghost btn-sm" @click.stop="emit('history', p)" title="История изменений">
              📜
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* ============================================
   КНОПКА ПОДЕЛИТЬСЯ ПРОЕКТОМ
   ============================================ */
.track-link-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-copy {
  position: relative;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #F8F9FA;
  color: #2C3E50;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-width: 140px;
  justify-content: center;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-copy .icon-share,
.btn-copy .icon-check {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.btn-copy:hover:not(.copied) {
  background: #E8ECF0;
  border-color: rgba(44, 62, 80, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-copy:active:not(.copied) {
  transform: translateY(0);
}

.btn-copy.copied {
  background: #10B981;
  border-color: #10B981;
  color: white;
  transform: scale(0.95);
}

.btn-copy.copied .icon-check {
  animation: checkmark 0.4s ease;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* ============================================
   ТАБЛИЦА ПРОЕКТОВ
   ============================================ */
.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #1A1A1A;
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.table th {
  background: #F8F9FA;
  font-weight: 600;
  color: rgba(26, 26, 26, 0.6);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.table tr {
  transition: background 0.15s;
}

.table tr:hover td {
  background: rgba(44, 62, 80, 0.03);
}

.table .clickable {
  cursor: pointer;
}

.actions {
  white-space: nowrap;
}

/* ============================================
   СТАТУС-БЕЙДЖ В ТАБЛИЦЕ
   ============================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .table th,
  .table td {
    padding: 8px 10px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .table th,
  .table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>