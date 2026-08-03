<!-- components/UserModal.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Редактирование пользователя' : 'Просмотр пользователя'"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    
    <div v-else-if="userData">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        label-position="right"
      >
        <!-- Основная информация -->
        <el-divider content-position="left">Основная информация</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Имя пользователя" prop="username">
              <el-input
                v-model="form.username"
                :disabled="!isEdit"
                placeholder="Введите имя пользователя"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input
                v-model="form.email"
                :disabled="!isEdit"
                placeholder="Введите email"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Имя" prop="first_name">
              <el-input
                v-model="form.first_name"
                :disabled="!isEdit"
                placeholder="Введите имя"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Фамилия" prop="last_name">
              <el-input
                v-model="form.last_name"
                :disabled="!isEdit"
                placeholder="Введите фамилию"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Статусы -->
        <el-divider content-position="left">Статусы</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Активен">
              <el-switch
                v-model="form.is_active"
                :disabled="!isEdit"
                active-text="Да"
                inactive-text="Нет"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Персонал">
              <el-switch
                v-model="form.is_staff"
                :disabled="!isEdit"
                active-text="Да"
                inactive-text="Нет"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Группы -->
        <el-divider content-position="left">
          <span>Группы</span>
          <el-button
            v-if="isEdit"
            type="primary"
            size="small"
            plain
            @click="openGroupManager"
            style="margin-left: 10px;"
          >
            <el-icon><Edit /></el-icon>
            Управление группами
          </el-button>
        </el-divider>

        <!-- Отображение текущих групп -->
        <div class="groups-display">
          <div v-if="displayGroups.length > 0" class="groups-container">
            <el-tag
              v-for="group in displayGroups"
              :key="group.id || group"
              type="primary"
              size="default"
              style="margin: 4px;"
            >
              {{ group.name || group }}
            </el-tag>
          </div>
          <el-empty
            v-else
            description="Пользователь не состоит в группах"
            :image-size="60"
          />
        </div>

        <!-- Информация о времени -->
        <el-divider content-position="left">Информация о времени</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Дата регистрации">
              <span>{{ formatDate(form.date_joined) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Последний вход">
              <span>{{ formatDate(form.last_login) || 'Никогда' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Отмена</el-button>
        <el-button
          v-if="isEdit"
          type="primary"
          @click="handleSave"
          :loading="saving"
        >
          Сохранить
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- Модалка управления группами -->
  <el-dialog
    v-model="showGroupManager"
    title="Управление группами"
    width="600px"
    :close-on-click-modal="false"
    @close="onGroupManagerClose"
  >
    <div class="group-manager">
      <el-transfer
        v-model="tempSelectedGroups"
        :data="allGroupsOptions"
        :titles="['Доступные группы', 'Группы пользователя']"
        filterable
        filter-placeholder="Поиск групп..."
        @change="handleGroupsChange"
      />
    </div>
    <template #footer>
      <el-button @click="showGroupManager = false">Закрыть</el-button>
      <el-button type="primary" @click="applyGroups">Применить</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useUserStore } from '../store'
import { useGroupStore } from '../stores/groupStore'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const userStore = useUserStore()
const groupStore = useGroupStore()

// Состояние
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const saving = ref(false)
const userData = ref(null)
const showGroupManager = ref(false)
const tempSelectedGroups = ref([])
const formRef = ref(null)

// Форма
const form = ref({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  is_active: true,
  is_staff: false,
  groups: [],
  groups_detail: [],
  date_joined: null,
  last_login: null
})

// Вычисляемое поле для отображения групп
const displayGroups = computed(() => {
  // Если есть groups_detail - используем его
  if (form.value.groups_detail && form.value.groups_detail.length > 0) {
    return form.value.groups_detail
  }
  // Иначе используем groups (массив названий)
  if (form.value.groups && form.value.groups.length > 0) {
    return form.value.groups.map(name => ({ id: name, name: name }))
  }
  return []
})

// Валидация
const rules = {
  username: [
    { required: true, message: 'Введите имя пользователя', trigger: 'blur' },
    { min: 3, max: 150, message: 'Имя должно быть от 3 до 150 символов', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Введите корректный email', trigger: 'blur' }
  ]
}

// Опции для Transfer
const allGroupsOptions = computed(() => {
  return groupStore.groups.map(group => ({
    key: group.id,
    label: group.name
  }))
})

// Открытие менеджера групп
const openGroupManager = () => {
  // Загружаем текущие группы пользователя в tempSelectedGroups
  const currentGroupIds = form.value.groups_detail?.map(g => g.id) || []
  tempSelectedGroups.value = [...currentGroupIds]
  showGroupManager.value = true
}

// Обработка изменения групп через Transfer
const handleGroupsChange = (value) => {
  tempSelectedGroups.value = value
}

// Применить изменения групп
const applyGroups = () => {
  // Находим выбранные группы
  const selectedGroupObjects = allGroupsOptions.value
    .filter(opt => tempSelectedGroups.value.includes(opt.key))
    .map(opt => ({
      id: opt.key,
      name: opt.label
    }))
  
  // Обновляем form
  form.value.groups_detail = selectedGroupObjects
  form.value.groups = selectedGroupObjects.map(g => g.name)
  
  showGroupManager.value = false
  ElMessage.success('Группы обновлены')
}

// Закрытие менеджера групп без применения
const onGroupManagerClose = () => {
  // Восстанавливаем предыдущее состояние
  const currentGroupIds = form.value.groups_detail?.map(g => g.id) || []
  tempSelectedGroups.value = [...currentGroupIds]
}

// Загрузка данных пользователя
const loadUser = async () => {
  if (!props.userId) return
  
  loading.value = true
  try {
    const user = await userStore.fetchUser(props.userId, true)
    userData.value = user
    
    // Получаем группы пользователя
    let groupsDetail = []
    let groupNames = []
    
    if (user.groups_detail && user.groups_detail.length > 0) {
      groupsDetail = user.groups_detail
      groupNames = user.groups_detail.map(g => g.name)
    } else if (user.groups && user.groups.length > 0) {
      // Если есть только названия групп, преобразуем в объекты
      groupNames = user.groups
      // Получаем полные данные групп из groupStore
      groupsDetail = groupStore.groups
        .filter(g => groupNames.includes(g.name))
        .map(g => ({ id: g.id, name: g.name }))
    }
    
    // Заполняем форму
    form.value = {
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active ?? true,
      is_staff: user.is_staff ?? false,
      groups: groupNames,
      groups_detail: groupsDetail,
      date_joined: user.date_joined || null,
      last_login: user.last_login || null
    }
    
    // Заполняем выбранные группы для Transfer
    tempSelectedGroups.value = groupsDetail.map(g => g.id)
    
  } catch (error) {
    console.error('Ошибка загрузки пользователя:', error)
    ElMessage.error('Не удалось загрузить данные пользователя')
  } finally {
    loading.value = false
  }
}

// Загрузка всех групп
const loadGroups = async () => {
  try {
    await groupStore.fetchGroups()
  } catch (error) {
    console.error('Ошибка загрузки групп:', error)
  }
}

// Сохранение
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    // Подготавливаем данные для отправки
    const updateData = {
      username: form.value.username,
      email: form.value.email,
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      is_active: form.value.is_active,
      is_staff: form.value.is_staff
    }
    
    // Обновляем пользователя
    const updatedUser = await userStore.updateUser(props.userId, updateData)
    
    // Обновляем группы пользователя
    const groupIds = form.value.groups_detail.map(g => g.id)
    if (groupIds.length > 0) {
      await userStore.updateUserGroups(props.userId, groupIds)
    } else {
      // Если групп нет - очищаем
      await userStore.updateUserGroups(props.userId, [])
    }
    
    ElMessage.success('Пользователь успешно обновлен')
    emit('saved')
    handleClose()
    
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    if (error.response?.data) {
      const errors = error.response.data
      const firstError = Object.values(errors)[0]
      ElMessage.error(firstError?.[0] || 'Ошибка при сохранении')
    } else {
      ElMessage.error('Ошибка при сохранении')
    }
  } finally {
    saving.value = false
  }
}

// Закрытие
const handleClose = () => {
  dialogVisible.value = false
  showGroupManager.value = false
  userData.value = null
  formRef.value?.clearValidate()
}

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}.${month}.${year} ${hours}:${minutes}`
  } catch {
    return null
  }
}

// Следим за открытием диалога
watch(dialogVisible, async (newVal) => {
  if (newVal && props.userId) {
    await Promise.all([loadUser(), loadGroups()])
  }
})

// Метод для открытия (вызывается из родителя)
const open = async () => {
  dialogVisible.value = true
}

defineExpose({
  open
})
</script>

<style scoped>
.loading-container {
  padding: 20px 0;
}

.groups-display {
  min-height: 60px;
  padding: 8px 0;
}

.groups-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.group-manager {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}

:deep(.el-transfer) {
  justify-content: center;
}

:deep(.el-transfer-panel) {
  width: 220px;
  height: 350px;
}
</style>