<!-- modules/app/widgets/ProjectInfo/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Информация о проекте</h2>
      <button 
        class="btn btn-ghost" 
        @click="$emit('edit')"
      >
        ✎ Редактировать
      </button>
    </div>
    
    <div v-if="loading" class="state">Загрузка…</div>
    <div v-else-if="project" class="info-grid">
      <div><span class="label">ID</span><span>{{ project.id }}</span></div>
      <div><span class="label">Клиент</span><span>{{ clientName }}</span></div>
      <div><span class="label">Статус</span><span>{{ statusName }}</span></div>
      <div><span class="label">Локация</span><span>{{ project.full_location_name || '—' }}</span></div>
      <div><span class="label">Тех. менеджер</span><span>{{ managerName }}</span></div>
      <div><span class="label">Создан</span><span>{{ formatDate(project.created_at) }}</span></div>
      <div><span class="label">Обновлен</span><span>{{ formatDate(project.updated_at) }}</span></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  projectId: {
    type: Number,
    required: true
  }
})

defineEmits(['edit'])

const store = useProjectsStore()
const { currentProject, loading } = storeToRefs(store)

// Используем переданный projectId для получения данных
const project = computed(() => currentProject.value)

const clientName = computed(() => 
  store.clientName(project.value?.client)
)

const statusName = computed(() => 
  store.statusName(project.value?.status)
)

const managerName = computed(() => 
  store.managerName(project.value?.tech_manager)
)

function formatDate(d) { 
  return d ? d.slice(0, 10) : '—' 
}
</script>

<style scoped>
/* ============================================
   ТЕМНЫЕ СТИЛИ ДЛЯ ProjectInfo
   ============================================ */

.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

/* ============================================
   ИНФОРМАЦИЯ О ПРОЕКТЕ (СЕТКА)
   ============================================ */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-grid > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid > div span:last-child {
  color: #D0D2D5;
  font-weight: 500;
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
  transition: all 0.2s;
  font-weight: 500;
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

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 640px) {
  .card {
    padding: 14px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .card-header .btn {
    width: 100%;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .info-grid > div {
    padding: 4px 0;
  }

  .label {
    font-size: 10px;
  }

  .info-grid > div span:last-child {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .info-grid > div {
    flex-direction: row;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid rgba(208, 210, 213, 0.05);
  }

  .info-grid > div:last-child {
    border-bottom: none;
  }
}
</style>