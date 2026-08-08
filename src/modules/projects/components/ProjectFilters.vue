<script setup>
const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  },
  selectedStatusId: {
    type: Number,
    default: null
  },
  activeFilterCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select-status', 'clear-filters'])
</script>

<template>
  <div v-if="statuses.length" class="status-filters">
    <div class="status-filters-header">
      <span class="status-filters-title">Фильтр по статусу:</span>
      <button v-if="activeFilterCount > 0" class="btn btn-ghost btn-sm" @click="emit('clear-filters')">
        ✕ Сбросить фильтр
      </button>
    </div>
    <div class="status-tiles">
      <div 
        v-for="status in statuses" 
        :key="status.id"
        class="status-tile"
        :class="{ active: selectedStatusId === status.id, disabled: status.count === 0 }"
        @click="status.count > 0 && emit('select-status', status.id)"
      >
        <span class="status-name">{{ status.name }}</span>
        <span class="status-count">{{ status.count }}</span>
      </div>
    </div>
  </div>

  <div v-if="selectedStatusId" class="filter-info">
    <span>Показаны проекты со статусом: 
      <strong>{{ statuses.find(s => s.id === selectedStatusId)?.name }}</strong>
    </span>
  </div>
</template>

<style scoped>
/* ============================================
   ФИЛЬТРЫ ПО СТАТУСАМ (ПЛИТКИ)
   ============================================ */
.status-filters {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.status-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-filters-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-tile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: #F8F9FA;
  border: 2px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
  user-select: none;
  color: #1A1A1A;
}

.status-tile:hover:not(.disabled) {
  border-color: #2C3E50;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background: #FFFFFF;
}

.status-tile.active {
  border-color: #2C3E50;
  background: rgba(44, 62, 80, 0.08);
  color: #2C3E50;
  box-shadow: 0 0 20px rgba(44, 62, 80, 0.05);
}

.status-tile.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.status-tile .status-name {
  font-weight: 500;
}

.status-tile .status-count {
  background: rgba(0, 0, 0, 0.05);
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  color: rgba(26, 26, 26, 0.5);
  font-weight: 500;
}

.status-tile.active .status-count {
  background: rgba(44, 62, 80, 0.12);
  color: #2C3E50;
}

/* ============================================
   ИНФОРМАЦИЯ О ФИЛЬТРЕ
   ============================================ */
.filter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(44, 62, 80, 0.05);
  border: 1px solid rgba(44, 62, 80, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #1A1A1A;
}

.filter-info strong {
  color: #2C3E50;
}

.filter-info-count {
  color: rgba(26, 26, 26, 0.5);
  font-size: 13px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .status-tiles {
    gap: 6px;
  }

  .status-tile {
    padding: 4px 12px;
    font-size: 13px;
  }

  .filter-info {
    flex-wrap: wrap;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .status-tiles {
    gap: 4px;
  }

  .status-tile {
    padding: 3px 10px;
    font-size: 12px;
  }

  .status-tile .status-count {
    padding: 0 6px;
    font-size: 10px;
  }
}
</style>