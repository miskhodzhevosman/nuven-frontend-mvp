<template>
  <Dialog
    v-model:visible="isVisible"
    header="Создать фабрику"
    :modal="true"
    :style="{ width: '450px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="handleCreateFactory">
      <div class="field">
        <label for="factory-name">Название <span class="req">*</span></label>
        <InputText id="factory-name" v-model="form.name" required />
      </div>

      <div class="field">
        <label for="factory-address">Адрес</label>
        <InputText id="factory-address" v-model="form.address" />
      </div>

      <div class="field">
        <label for="factory-contacts">Контакты</label>
        <InputText id="factory-contacts" v-model="form.contacts" />
      </div>

      <div v-if="errorMessage" class="p-message p-message-error">
        <i class="pi pi-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button 
          label="Создать" 
          icon="pi pi-check" 
          type="submit"
          :loading="factoriesStore.saving"
          :disabled="factoriesStore.saving"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps({
  visible: Boolean,
  factoriesStore: Object
})

const emit = defineEmits(['update:visible', 'created'])

const isVisible = ref(props.visible)
const errorMessage = ref('')

const form = reactive({
  name: '',
  address: '',
  contacts: ''
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if (val) {
    form.name = ''
    form.address = ''
    form.contacts = ''
    errorMessage.value = ''
  }
})

watch(isVisible, (val) => emit('update:visible', val))

async function handleCreateFactory() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = 'Введите название фабрики'
    return
  }

  try {
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      contacts: form.contacts.trim(),
    }

    const created = await props.factoriesStore.createFactory(payload)
    await props.factoriesStore.fetchFactories()
    
    emit('created', created.id)
    isVisible.value = false
    
  } catch (error) {
    errorMessage.value = error?.message || 'Не удалось создать фабрику'
  }
}
</script>