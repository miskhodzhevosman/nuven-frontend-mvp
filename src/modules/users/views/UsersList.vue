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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import UserTable from '../widgets/UserTable.vue'

const router = useRouter()
const userStore = useUserStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const users = computed(() => userStore.users)
const isLoading = computed(() => userStore.isLoading)
const pagination = computed(() => userStore.pagination)
const error = computed(() => userStore.error)

// Загрузка пользователей
const loadUsers = async () => {
  console.log('📋 loadUsers вызван')
  try {
    await userStore.fetchUsers({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    })
  } catch (error) {
    console.error('❌ loadUsers error:', error)
    ElMessage.error('Не удалось загрузить пользователей')
  }
}

// Обновление данных
const refreshData = async () => {
  console.log('🔄 refreshData вызван')
  await loadUsers()
  ElMessage.success('Данные обновлены')
}

// Поиск с debounce
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 500)
}

// Пагинация
const handlePageChange = () => loadUsers()
const handlePageSizeChange = () => {
  currentPage.value = 1
  loadUsers()
}

// Переходы
const goToCreate = () => router.push('/users/create')
const goToEdit = (id) => router.push(`/users/${id}/edit`)

// Удаление
const handleDelete = async (id) => {
  console.log(`🗑️ Удаление пользователя ${id}`)
  try {
    await ElMessageBox.confirm(
      'Вы уверены, что хотите удалить этого пользователя?',
      'Подтверждение удаления',
      {
        confirmButtonText: 'Да, удалить',
        cancelButtonText: 'Отмена',
        type: 'warning'
      }
    )
    
    await userStore.deleteUser(id)
    ElMessage.success('Пользователь удален')
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ handleDelete error:', error)
      ElMessage.error('Ошибка при удалении пользователя')
    }
  }
}

// Активация/деактивация
const handleToggleActive = async (id, isActive) => {
  console.log(`🔄 Изменение статуса пользователя ${id} на ${isActive}`)
  try {
    await userStore.toggleUserActive(id, isActive)
    ElMessage.success(`Пользователь ${isActive ? 'активирован' : 'деактивирован'}`)
  } catch (error) {
    console.error('❌ handleToggleActive error:', error)
    ElMessage.error('Ошибка при изменении статуса')
  }
}

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
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
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