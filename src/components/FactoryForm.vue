<template>
  <div class="factory-form">
    <h2>
      {{ isEditMode ? 'Редактировать фабрику' : 'Новая фабрика' }}
    </h2>

    <form @submit.prevent="submitForm">
      <div class="form-row">
        <label for="name">Название</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Введите название"
        />
      </div>

      <div class="form-row">
        <label for="address">Адрес</label>
        <input
          id="address"
          v-model="form.address"
          type="text"
          placeholder="Введите адрес"
        />
      </div>

      <p v-if="localError" class="error">
        {{ localError }}
      </p>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="store.createLoading || store.updateLoading"
        >
          {{ submitButtonText }}
        </button>

        <button
          type="button"
          @click="handleCancel"
          :disabled="store.createLoading || store.updateLoading"
        >
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useSuppliesStore } from '@/stores/factoryStore'

const props = defineProps({
  factory: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['success', 'cancel'])
const store = useSuppliesStore()

const localError = ref('')

const form = reactive({
  name: '',
  address: ''
})

const isEditMode = computed(() => !!props.factory)

const submitButtonText = computed(() => {
  if (store.createLoading || store.updateLoading) {
    return 'Сохранение...'
  }

  return isEditMode.value ? 'Сохранить изменения' : 'Создать'
})

const fillForm = () => {
  form.name = props.factory?.name ?? ''
  form.address = props.factory?.address ?? ''
}

watch(
  () => props.factory,
  () => {
    fillForm()
    localError.value = ''
  },
  { immediate: true }
)

const resetForm = () => {
  form.name = ''
  form.address = ''
  localError.value = ''
}

const submitForm = async () => {
  localError.value = ''

  if (!form.name.trim() || !form.address.trim()) {
    localError.value = 'Заполни все поля'
    return
  }

  try {
    if (isEditMode.value) {
      await store.updateFactory(props.factory.id, {
        name: form.name,
        address: form.address
      })
    } else {
      await store.createFactory({
        name: form.name,
        address: form.address
      })
    }

    resetForm()
    emit('success')
  } catch (error) {
    localError.value = isEditMode.value
      ? 'Не удалось обновить фабрику'
      : 'Не удалось создать фабрику'
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<style scoped>
h2 {color: #f3f4f6;}
.factory-form {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 500px;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-row input {
  padding: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.error {
  color: red;
  margin-bottom: 12px;
}
</style>