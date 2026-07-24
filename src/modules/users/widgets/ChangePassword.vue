<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="140px"
  >
    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" :closable="true" @close="clearError" />
    </div>
    
    <el-form-item label="Текущий пароль" prop="old_password">
      <el-input 
        v-model="form.old_password" 
        type="password" 
        placeholder="Введите текущий пароль"
        show-password
      />
    </el-form-item>

    <el-form-item label="Новый пароль" prop="new_password">
      <el-input 
        v-model="form.new_password" 
        type="password" 
        placeholder="Введите новый пароль"
        show-password
      />
    </el-form-item>

    <el-form-item label="Подтверждение" prop="confirm_password">
      <el-input 
        v-model="form.confirm_password" 
        type="password" 
        placeholder="Подтвердите новый пароль"
        show-password
      />
    </el-form-item>

    <el-form-item>
      <el-button 
        type="primary" 
        @click="handleSubmit" 
        :loading="isLoading"
        style="width: 100%;"
      >
        Сменить пароль
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'

const emit = defineEmits(['success'])

const userStore = useUserStore()
const formRef = ref(null)

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

// Проверка совпадения паролей
const validateConfirm = (rule, value, callback) => {
  if (value !== form.new_password) {
    callback(new Error('Пароли не совпадают'))
  } else {
    callback()
  }
}

const rules = {
  old_password: [
    { required: true, message: 'Введите текущий пароль', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: 'Введите новый пароль', trigger: 'blur' },
    { min: 6, message: 'Пароль должен быть не менее 6 символов', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: 'Подтвердите пароль', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const clearError = () => {
  userStore.clearError()
}

const handleSubmit = async () => {
  console.log('🔄 changePassword submit')
  try {
    await formRef.value?.validate()
    
    await userStore.changePassword({
      old_password: form.old_password,
      new_password: form.new_password,
      confirm_password: form.confirm_password
    })
    
    // Очищаем форму
    form.old_password = ''
    form.new_password = ''
    form.confirm_password = ''
    formRef.value?.resetFields()
    
    emit('success')
  } catch (error) {
    console.error('❌ changePassword error:', error)
  }
}
</script>

<style scoped>
.error-message {
  margin-bottom: 20px;
}
</style>