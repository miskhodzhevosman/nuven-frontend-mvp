<!-- components/GroupManager.vue -->
<template>
  <div class="group-manager">
    <div class="header">
      <h2>Управление группами</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        Создать группу
      </el-button>
    </div>

    <el-table :data="groups" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="Название" min-width="150" />
      <el-table-column prop="user_count" label="Пользователей" width="120" align="center" />
      <el-table-column label="Права" min-width="250">
        <template #default="{ row }">
          <el-tag
            v-for="perm in row.permissions"
            :key="perm"
            size="small"
            style="margin: 2px;"
          >
            {{ getPermissionName(perm) }}
          </el-tag>
          <span v-if="!row.permissions?.length" style="color: #909399; font-size: 12px;">
            Нет прав
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editGroup(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" type="danger" @click="deleteGroup(row.id)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Диалог создания/редактирования -->
    <el-dialog
      v-model="showDialog"
      :title="editingGroup ? 'Редактирование группы' : 'Создание группы'"
      width="1000px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="Название" prop="name">
          <el-input
            v-model="form.name"
            placeholder="Введите название группы"
          />
        </el-form-item>

        <el-form-item label="Права">
          <el-transfer
            v-model="form.permissions"
            :data="permissionsOptions"
            :titles="['Доступные права', 'Права группы']"
            filterable
            filter-placeholder="Поиск прав..."
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">Отмена</el-button>
        <el-button type="primary" @click="saveGroup" :loading="saving">
          {{ editingGroup ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useGroupStore } from '../stores/groupStore'

const groupStore = useGroupStore()

// Computed
const groups = computed(() => groupStore.groups)
const loading = computed(() => groupStore.isLoading)
const permissions = computed(() => groupStore.permissions)

// Состояние
const showDialog = ref(false)
const saving = ref(false)
const editingGroup = ref(null)
const formRef = ref(null)

// Форма
const form = ref({
  name: '',
  permissions: []
})

// Правила валидации
const rules = {
  name: [
    { required: true, message: 'Введите название группы', trigger: 'blur' },
    { min: 3, max: 150, message: 'Название должно быть от 3 до 150 символов', trigger: 'blur' }
  ]
}

// Опции для Transfer
const permissionsOptions = computed(() => {
  return permissions.value.map(perm => ({
    key: perm.codename,
    label: `${perm.name} (${perm.app_label}.${perm.model})`
  }))
})

// Получить название права по codename
const getPermissionName = (codename) => {
  const perm = permissions.value.find(p => p.codename === codename)
  return perm ? perm.name : codename
}

// Загрузка данных
const loadData = async () => {
  try {
    await Promise.all([
      groupStore.fetchGroups(),
      groupStore.fetchPermissions()
    ])
  } catch (error) {
    ElMessage.error('Ошибка загрузки данных')
  }
}

// Открыть диалог создания
const openCreateDialog = () => {
  editingGroup.value = null
  form.value = { name: '', permissions: [] }
  showDialog.value = true
}

// Редактировать группу
const editGroup = (group) => {
  editingGroup.value = group
  form.value = {
    name: group.name,
    permissions: group.permissions || []
  }
  showDialog.value = true
}

// Сохранить группу
const saveGroup = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true

    const data = {
      name: form.value.name,
      permissions: form.value.permissions
    }

    if (editingGroup.value) {
      await groupStore.updateGroup(editingGroup.value.id, data)
      ElMessage.success('Группа обновлена')
    } else {
      await groupStore.createGroup(data)
      ElMessage.success('Группа создана')
    }

    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    ElMessage.error(error.response?.data?.detail || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

// Удалить группу
const deleteGroup = async (id) => {
  try {
    await ElMessageBox.confirm(
      'Вы уверены, что хотите удалить эту группу? Пользователи потеряют связанные права.',
      'Подтверждение удаления',
      {
        confirmButtonText: 'Да, удалить',
        cancelButtonText: 'Отмена',
        type: 'warning'
      }
    )
    
    await groupStore.deleteGroup(id)
    ElMessage.success('Группа удалена')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Ошибка удаления')
    }
  }
}

// Сброс формы
const resetForm = () => {
  formRef.value?.clearValidate()
  editingGroup.value = null
}

// Монтирование
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.group-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

:deep(.el-transfer) {
  justify-content: center;
}

:deep(.el-transfer-panel) {
  width: 250px;
  height: 400px;
}
</style>