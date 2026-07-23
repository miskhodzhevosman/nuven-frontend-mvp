<!-- modules/supply/widgets/FactoryFormModal/index.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Новая фабрика</h2>
      <form ref="formRef" @submit.prevent="submit">
        <label class="field">
          <span>Название *</span>
          <input v-model="form.name" required maxlength="255" />
        </label>
        
        <label class="field">
          <span>Адрес</span>
          <input v-model="form.address" />
        </label>
        
        <label class="field">
          <span>Контакты</span>
          <input v-model="form.contacts" />
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            Создать
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'created'])

const store = useSupplyStore()
const { loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  name: '',
  address: '',
  contacts: '',
})

async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  try {
    const created = await store.createFactory({
      name: form.name,
      address: form.address || '',
      contacts: form.contacts || '',
    })
    emit('created', created)
    close()
  } catch (e) {
    console.error('Failed to create factory:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  Object.assign(form, { name: '', address: '', contacts: '' })
}
</script>