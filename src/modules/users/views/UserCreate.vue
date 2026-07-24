<template>
  <div class="user-create-page">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        Назад
      </el-button>
      <h1>Создание пользователя</h1>
    </div>

    <el-card>
      <div v-if="error" class="error-message">
        <el-alert :title="error" type="error" :closable="false" />
      </div>
      
      <UserForm
        :loading="isLoading"
        @submit="handleSubmit"
        @cancel="goBack"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import UserForm from '../widgets/UserForm.vue'

const router = useRouter()
const userStore = useUserStore()

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)

const goBack = () => router.push('/users')

const handleSubmit = async (formData) => {
  console.log('🔄 Создание пользователя:', formData)
  try {
    await userStore.createUser(formData)
    ElMessage.success('Пользователь успешно создан')
    router.push('/users')
  } catch (error) {
    console.error('❌ handleSubmit error:', error)
    ElMessage.error('Ошибка при создании пользователя')
  }
}
</script>

<style scoped>
.user-create-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
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