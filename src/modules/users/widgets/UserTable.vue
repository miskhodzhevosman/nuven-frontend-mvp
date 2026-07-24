<template>
  <el-table :data="users" v-loading="loading" stripe>
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="username" label="Имя пользователя" min-width="150" />
    <el-table-column prop="email" label="Email" min-width="200" />
    <el-table-column prop="first_name" label="Имя" min-width="120" />
    <el-table-column prop="last_name" label="Фамилия" min-width="120" />
    
    <!-- Новая колонка: последний вход -->
    <el-table-column label="Последний вход" min-width="180">
      <template #default="{ row }">
        <!-- ОТЛАДКА: посмотрим что в row -->
        {{ console.log('Row data:', row) }}
        {{ console.log('Row last_login:', row?.last_login) }}
        {{ console.log('Row keys:', Object.keys(row)) }}
        
        <span v-if="row?.last_login">
          {{ formatDate(row.last_login) }}
        </span>
        <el-tag v-else type="info" size="small">Никогда</el-tag>
      </template>
    </el-table-column>

    <!-- Новая колонка: дата регистрации -->
    <el-table-column label="Дата регистрации" min-width="180">
      <template #default="{ row }">
        {{ console.log('Row date_joined:', row?.date_joined) }}
        <span v-if="row?.date_joined">
          {{ formatDate(row.date_joined) }}
        </span>
        <el-tag v-else type="info" size="small">Нет данных</el-tag>
      </template>
    </el-table-column>

    <el-table-column prop="is_active" label="Статус" width="100" align="center">
      <template #default="{ row }">
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
import { Edit, Delete, Switch } from '@element-plus/icons-vue'

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

defineEmits(['edit', 'delete', 'toggle-active'])

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