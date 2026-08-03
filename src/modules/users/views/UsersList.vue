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

    <!-- Фильтр по группам -->
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
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle-active="handleToggleActive"
        @view="handleView"
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

    <!-- Модальное окно -->
    <UserModal
      ref="userModalRef"
      v-model="showModal"
      :user-id="selectedUserId"
      :is-edit="isEditMode"
      @saved="onUserSaved"
    />
    <GroupManager />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import UserTable from '../widgets/UserTable.vue'
import GroupFilter from '../components/GroupFilter.vue'
import UserModal from '../components/UserModal.vue'
import GroupManager from '../components/GroupManager.vue'

const router = useRouter()
const userStore = useUserStore()

// Состояние
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedGroup = ref(null)

// Состояние модалки
const showModal = ref(false)
const selectedUserId = ref(null)
const isEditMode = ref(false)
const userModalRef = ref(null)

// Computed
const users = computed(() => userStore.users)
const isLoading = computed(() => userStore.isLoading)
const pagination = computed(() => userStore.pagination)
const error = computed(() => userStore.error)

// ========================================
// ЗАГРУЗКА ДАННЫХ
// ========================================

const loadUsers = async () => {
  console.log('📋 loadUsers вызван')
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    }
    
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

// Обновление данных
const refreshData = async () => {
  console.log('🔄 refreshData вызван')
  await loadUsers()
  ElMessage.success('Данные обновлены')
}

// ========================================
// ПОИСК И ПАГИНАЦИЯ
// ========================================

let searchTimeout = null

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 500)
}

const handlePageChange = () => {
  loadUsers()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadUsers()
}

// ========================================
// ФИЛЬТР ПО ГРУППАМ
// ========================================

const handleGroupFilter = (groupName) => {
  console.log('🔄 Фильтр по группе изменен:', groupName)
  selectedGroup.value = groupName
  currentPage.value = 1
  loadUsers()
}

// ========================================
// РАБОТА С ПОЛЬЗОВАТЕЛЯМИ
// ========================================

// Переход к созданию пользователя
const goToCreate = () => {
  router.push('/users/create')
}

// Открытие модалки для просмотра
const handleView = (userId) => {
  console.log('👁️ Просмотр пользователя:', userId)
  openUserModal(userId, false)
}

// Открытие модалки для редактирования
const handleEdit = (userId) => {
  console.log('✏️ Редактирование пользователя:', userId)
  openUserModal(userId, true)
}

// Открытие модалки
const openUserModal = (userId, isEdit = true) => {
  console.log('🔄 Открытие модалки для пользователя:', userId, 'Режим:', isEdit ? 'редактирование' : 'просмотр')
  selectedUserId.value = userId
  isEditMode.value = isEdit
  showModal.value = true
}

// Обработчик сохранения
const onUserSaved = () => {
  console.log('✅ Пользователь сохранен, обновляем список')
  loadUsers()
  ElMessage.success('Пользователь успешно обновлен')
}

// Удаление пользователя
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
    await loadUsers()
  } catch (error) {
    console.error('❌ handleToggleActive error:', error)
    ElMessage.error('Ошибка при изменении статуса')
  }
}

// ========================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ========================================

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