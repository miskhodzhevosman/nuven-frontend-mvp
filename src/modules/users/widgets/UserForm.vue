<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="140px"
  >
    <el-form-item label="Имя пользователя" prop="username">
      <el-input v-model="form.username" placeholder="Введите имя пользователя" />
    </el-form-item>

    <el-form-item label="Email" prop="email">
      <el-input v-model="form.email" placeholder="Введите email" />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Имя" prop="first_name">
          <el-input v-model="form.first_name" placeholder="Имя" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Фамилия" prop="last_name">
          <el-input v-model="form.last_name" placeholder="Фамилия" />
        </el-form-item>
      </el-col>
    </el-row>

    <template v-if="!isEdit">
      <el-divider>Пароль</el-divider>
      
      <el-form-item label="Пароль" prop="password">
        <el-input 
          v-model="form.password" 
          type="password" 
          placeholder="Введите пароль"
          show-password
        />
      </el-form-item>

      <el-form-item label="Подтверждение пароля" prop="confirm_password">
        <el-input 
          v-model="form.confirm_password" 
          type="password" 
          placeholder="Подтвердите пароль"
          show-password
        />
      </el-form-item>
    </template>

    <el-form-item>
      <el-button @click="$emit('cancel')">Отмена</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? 'Обновить' : 'Создать' }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)

const form = reactive({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  confirm_password: ''
})

// Валидация подтверждения пароля
const validateConfirm = (rule, value, callback) => {
  if (!props.isEdit && value !== form.password) {
    callback(new Error('Пароли не совпадают'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: 'Введите имя пользователя', trigger: 'blur' },
    { min: 3, max: 150, message: 'Длина от 3 до 150 символов', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Введите корректный email', trigger: 'blur' }
  ],
  password: [
    { required: !props.isEdit, message: 'Введите пароль', trigger: 'blur' },
    { min: 6, message: 'Пароль должен быть не менее 6 символов', trigger: 'blur' }
  ],
  confirm_password: [
    { required: !props.isEdit, message: 'Подтвердите пароль', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// Заполнение формы при редактировании
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    form.username = newData.username || ''
    form.email = newData.email || ''
    form.first_name = newData.first_name || ''
    form.last_name = newData.last_name || ''
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    const submitData = { ...form }
    if (props.isEdit) {
      delete submitData.password
      delete submitData.confirm_password
    }
    
    emit('submit', submitData)
  } catch (error) {
    // Ошибка валидации
  }
}
</script>