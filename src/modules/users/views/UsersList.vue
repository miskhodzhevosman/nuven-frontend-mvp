<!-- UsersList.vue -->
<template>
  <div class="users-page">
    <div class="page-header">
      <h1>Пользователи</h1>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="Поиск по имени или email..."
          prefix-icon="Search"
          @input="handleSearch"
          clearable
          style="width: 300px; margin-right: 16px;"
        />
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          Добавить пользователя
        </el-button>
        <el-button @click="refreshData" :loading="isLoading">
          <el-icon><Refresh /></el-icon>
          Обновить
        </el-button>
      </div>
    </div>

    <!-- Добавляем компонент фильтра -->
    <GroupFilter 
      :total-users="pagination.count" 
      @filter-change="handleGroupFilter"
    />

    <el-card shadow="never">
      <div v-if="error" class="error-message">
        <el-alert :title="error" type="error" :closable="false" />
      </div>
      
      <UserTable
        :users="users"
        :loading="isLoading"
        @edit="goToEdit"
        @delete="handleDelete"
        @toggle-active="handleToggleActive"
      />
    </el-card>

    <div class="pagination-wrapper" v-if="pagination.count > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="pagination.count"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import UserTable from '../widgets/UserTable.vue'
import GroupFilter from '../components/GroupFilter.vue'  // ← Импортируем фильтр

const router = useRouter()
const userStore = useUserStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedGroup = ref(null)  // ← Добавляем состояние для выбранной группы

const users = computed(() => userStore.users)
const isLoading = computed(() => userStore.isLoading)
const pagination = computed(() => userStore.pagination)
const error = computed(() => userStore.error)

// Загрузка пользователей с учетом фильтра по группе
const loadUsers = async () => {
  console.log('📋 loadUsers вызван')
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    }
    
    // Добавляем фильтр по группе, если выбран
    if (selectedGroup.value) {
      params.group = selectedGroup.value
      console.log('📋 Фильтр по группе:', selectedGroup.value)
    }
    
    await userStore.fetchUsers(params)
  } catch (error) {
    console.error('❌ loadUsers error:', error)
    ElMessage.error('Не удалось загрузить пользователей')
  }
}

// Обработчик изменения фильтра по группам
const handleGroupFilter = (groupName) => {
  console.log('🔄 Фильтр по группе изменен:', groupName)
  selectedGroup.value = groupName
  currentPage.value = 1  // Сбрасываем на первую страницу
  loadUsers()
}

// ... остальные методы (refreshData, handleSearch, handlePageChange, etc.)

// Загрузка при монтировании
onMounted(() => {
  console.log('🚀 UsersList mounted')
  loadUsers()
})
</script>

<style scoped>
.users-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.actions {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.error-message {
  margin-bottom: 20px;
}
</style>