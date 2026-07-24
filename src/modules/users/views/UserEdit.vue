<template>
  <div class="user-edit-page">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        Назад
      </el-button>
      <h1>Редактирование пользователя</h1>
      <el-tag v-if="user" :type="user.is_active ? 'success' : 'danger'">
        {{ user.is_active ? 'Активен' : 'Заблокирован' }}
      </el-tag>
    </div>

    <div v-loading="isLoading">
      <el-card v-if="user">
        <UserForm
          :initial-data="user"
          :loading="isLoading"
          :is-edit="true"
          @submit="handleSubmit"
          @cancel="goBack"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import UserForm from '../widgets/UserForm.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userId = computed(() => Number(route.params.id))
const user = computed(() => userStore.selectedUser)
const isLoading = computed(() => userStore.isLoading)

const goBack = () => router.push('/users')

const loadUser = async () => {
  try {
    await userStore.fetchUser(userId.value)
  } catch (error) {
    ElMessage.error('Не удалось загрузить данные пользователя')
    router.push('/users')
  }
}

const handleSubmit = async (formData) => {
  try {
    await userStore.updateUser(userId.value, formData)
    ElMessage.success('Пользователь успешно обновлен')
    router.push('/users')
  } catch (error) {
    ElMessage.error('Ошибка при обновлении пользователя')
  }
}

onMounted(() => {
  if (userId.value) {
    loadUser()
  }
})
</script>

<style scoped>
.user-edit-page {
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
</style>