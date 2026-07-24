<template>
  <div class="user-profile-page">
    <div class="page-header">
      <h1>Мой профиль</h1>
      <el-button @click="refreshProfile" :loading="isLoading">
        <el-icon><Refresh /></el-icon>
        Обновить
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>Личные данные</span>
          </template>
          
          <div v-loading="isLoading">
            <div v-if="error" class="error-message">
              <el-alert :title="error" type="error" :closable="false" />
            </div>
            
            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="120px"
            >
              <el-form-item label="Имя пользователя" prop="username">
                <el-input v-model="profileForm.username" />
              </el-form-item>
              
              <el-form-item label="Email" prop="email">
                <el-input v-model="profileForm.email" />
              </el-form-item>
              
              <el-form-item label="Имя" prop="first_name">
                <el-input v-model="profileForm.first_name" />
              </el-form-item>
              
              <el-form-item label="Фамилия" prop="last_name">
                <el-input v-model="profileForm.last_name" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleUpdateProfile" :loading="isUpdating">
                  Сохранить
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>Смена пароля</span>
          </template>
          
          <ChangePassword @success="handlePasswordSuccess" />
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>Информация о профиле</span>
          </template>
          
          <el-descriptions :column="1" border v-if="currentUser">
            <el-descriptions-item label="ID">{{ currentUser.id }}</el-descriptions-item>
            <el-descriptions-item label="Статус">
              <el-tag :type="currentUser.is_active ? 'success' : 'danger'">
                {{ currentUser.is_active ? 'Активен' : 'Заблокирован' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Дата регистрации">
              {{ formatDate(currentUser.date_joined) }}
            </el-descriptions-item>
            <el-descriptions-item label="Последний вход">
              <template v-if="currentUser.last_login">
                {{ formatDate(currentUser.last_login) }}
              </template>
              <el-tag v-else type="info" size="small">Никогда</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Статус администратора">
              <el-tag :type="currentUser.is_staff ? 'warning' : 'info'">
                {{ currentUser.is_staff ? 'Администратор' : 'Пользователь' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import ChangePassword from '../widgets/ChangePassword.vue'

const userStore = useUserStore()
const profileFormRef = ref(null)

const currentUser = computed(() => userStore.currentUser)
const isLoading = computed(() => userStore.isLoading)
const isUpdating = computed(() => userStore.isUpdating)
const error = computed(() => userStore.error)

const profileForm = reactive({
  username: '',
  email: '',
  first_name: '',
  last_name: ''
})

const profileRules = {
  username: [
    { required: true, message: 'Введите имя пользователя', trigger: 'blur' },
    { min: 3, max: 150, message: 'Длина от 3 до 150 символов', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Введите корректный email', trigger: 'blur' }
  ]
}

// Форматирование даты
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

// Обновление профиля
const refreshProfile = async () => {
  console.log('🔄 refreshProfile вызван')
  try {
    await userStore.fetchCurrentUser(true)
    updateFormData()
    ElMessage.success('Данные обновлены')
  } catch (error) {
    console.error('❌ refreshProfile error:', error)
    ElMessage.error('Ошибка обновления данных')
  }
}

// Обновление данных формы
const updateFormData = () => {
  if (currentUser.value) {
    profileForm.username = currentUser.value.username
    profileForm.email = currentUser.value.email
    profileForm.first_name = currentUser.value.first_name || ''
    profileForm.last_name = currentUser.value.last_name || ''
  }
}

// Загрузка профиля
const loadProfile = async () => {
  console.log('📋 loadProfile вызван')
  try {
    await userStore.fetchCurrentUser()
    updateFormData()
  } catch (error) {
    console.error('❌ loadProfile error:', error)
    ElMessage.error('Не удалось загрузить профиль')
  }
}

// Обновление профиля
const handleUpdateProfile = async () => {
  console.log('🔄 handleUpdateProfile вызван')
  try {
    await profileFormRef.value?.validate()
    
    await userStore.updateCurrentUser({
      username: profileForm.username,
      email: profileForm.email,
      first_name: profileForm.first_name,
      last_name: profileForm.last_name
    })
    
    ElMessage.success('Профиль обновлен')
  } catch (error) {
    console.error('❌ handleUpdateProfile error:', error)
    ElMessage.error('Ошибка при обновлении профиля')
  }
}

// Успешная смена пароля
const handlePasswordSuccess = () => {
  console.log('✅ Пароль изменен успешно')
  ElMessage.success('Пароль успешно изменен')
}

// Автоматическое обновление каждые 5 минут
let refreshInterval = null

onMounted(() => {
  console.log('🚀 UserProfile mounted')
  loadProfile()
  
  // Обновляем каждые 5 минут
  refreshInterval = setInterval(() => {
    console.log('⏰ Автоматическое обновление профиля')
    userStore.fetchCurrentUser(true).then(() => {
      updateFormData()
    })
  }, 300000) // 5 минут
})

// Очистка интервала при размонтировании
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.user-profile-page {
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

.error-message {
  margin-bottom: 20px;
}
</style>