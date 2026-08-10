<script setup>
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const store = useProjectsStore()
const { statuses } = storeToRefs(store)

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['open', 'history'])

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
    // Можно показать уведомление
    alert('Ссылка скопирована!')
  } catch (err) {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = link
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('Ссылка скопирована!')
  }
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
          <th>Ссылка для клиента</th>
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
              <code class="hash-preview">{{ p.hashid }}</code>
              <button 
                class="btn btn-ghost btn-sm btn-copy" 
                @click.stop="copyTrackLink(p.hashid, $event)"
                title="Скопировать ссылку для клиента"
              >
                📋
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
.track-link-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hash-preview {
  font-family: monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  color: #666;
  letter-spacing: 0.5px;
}

.btn-copy {
  padding: 2px 6px;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-copy:hover {
  opacity: 1;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background: #f9f9f9;
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