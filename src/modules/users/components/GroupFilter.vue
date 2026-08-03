<!-- components/GroupFilter.vue -->
<template>
  <div class="group-filter">
    <div class="filter-header">
      <span class="filter-label">Фильтр по группам:</span>
      <el-button 
        v-if="selectedGroup" 
        size="small" 
        type="primary" 
        plain
        @click="clearFilter"
      >
        <el-icon><Close /></el-icon>
        Сбросить фильтр
      </el-button>
    </div>
    
    <div class="group-tiles">
      <!-- Плитка "Все пользователи" -->
      <div 
        class="group-tile"
        :class="{ active: !selectedGroup }"
        @click="selectGroup(null)"
      >
        <div class="tile-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="tile-info">
          <div class="tile-name">Все пользователи</div>
          <div class="tile-count">{{ totalUsers }} чел.</div>
        </div>
      </div>
      
      <!-- Плитки групп -->
      <div 
        v-for="group in groups" 
        :key="group.id"
        class="group-tile"
        :class="{ active: selectedGroup === group.name }"
        @click="selectGroup(group.name)"
      >
        <div class="tile-icon" :style="{ backgroundColor: getGroupColor(group.name) }">
          <el-icon><Folder /></el-icon>
        </div>
        <div class="tile-info">
          <div class="tile-name">{{ group.name }}</div>
          <div class="tile-count">{{ group.user_count || 0 }} чел.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, Folder, Close } from '@element-plus/icons-vue'
import { useGroupStore } from '../stores/groupStore'

const props = defineProps({
  totalUsers: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['filter-change'])

const groupStore = useGroupStore()
const selectedGroup = ref(null)
const groups = computed(() => groupStore.groups)

// Цвета для групп (можно сделать динамическими)
const getGroupColor = (groupName) => {
  const colors = {
    'Администраторы': '#409EFF',
    'Модераторы': '#E6A23C',
    'Менеджеры': '#67C23A',
    'Пользователи': '#909399'
  }
  return colors[groupName] || '#909399'
}

const selectGroup = (groupName) => {
  selectedGroup.value = groupName
  emit('filter-change', groupName)
}

const clearFilter = () => {
  selectGroup(null)
}

// Загружаем группы при монтировании
onMounted(async () => {
  await groupStore.fetchGroupsWithCounts()
})
</script>

<style scoped>
.group-filter {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.group-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.group-tile {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.group-tile:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-tile.active {
  background: #ecf5ff;
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.tile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
  font-size: 20px;
}

.tile-info {
  display: flex;
  flex-direction: column;
}

.tile-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.tile-count {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}
</style>