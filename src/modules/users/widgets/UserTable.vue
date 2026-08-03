<template>
  <el-table :data="users" v-loading="loading" stripe>
    
    <el-table-column prop="username" label="Имя пользователя" min-width="150" />

    <el-table-column prop="first_name" label="Имя" min-width="120" />
    <el-table-column prop="last_name" label="Фамилия" min-width="120" />
    
    <!-- Новая колонка: Группы -->
    <el-table-column label="Группы" min-width="120">
      <template #default="{ row }">
        <div v-if="row.groups && row.groups.length > 0" class="groups-container">
          <el-tag
            v-for="group in row.groups"
            :key="group"
            size="small"
            type="primary"
            style="margin: 2px;"
          >
            {{ group }}
          </el-tag>
        </div>
        <el-tag v-else type="info" size="small">Нет групп</el-tag>
      </template>
    </el-table-column>


    <el-table-column prop="is_active" label="Статус" width="100" align="center">
      <template #default="{ row }">
        <el-button size="small" type="info" @click="$emit('view', row.id)">
          <el-icon><View /></el-icon>
          Просмотр
        </el-button>
        <el-tag :type="row.is_active ? 'success' : 'danger'">
          {{ row.is_active ? 'Активен' : 'Заблокирован' }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column label="Действия" width="280" fixed="right">
      <template #default="{ row }">
        <el-button size="small" @click="$emit('edit', row.id)">
          <el-icon><Edit /></el-icon>
          Редактировать
        </el-button>
        <el-button 
          size="small" 
          :type="row.is_active ? 'warning' : 'success'"
          @click="$emit('toggle-active', row.id, !row.is_active)"
        >
          <el-icon><Switch /></el-icon>
          {{ row.is_active ? 'Заблокировать' : 'Активировать' }}
        </el-button>
        <el-button size="small" type="danger" @click="$emit('delete', row.id)">
          <el-icon><Delete /></el-icon>
          Удалить
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { Edit, Delete, Switch, View } from '@element-plus/icons-vue'

defineProps({
  users: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete', 'toggle-active', 'view'])

const formatDate = (dateString) => {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}.${month}.${year} ${hours}:${minutes}`
  } catch (error) {
    return '—'
  }
}
</script>

<style scoped>
.groups-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
</style>