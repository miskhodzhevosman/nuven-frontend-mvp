<template>
  <Dialog
    v-model:visible="isVisible"
    header="Создание нового товара"
    :modal="true"
    :style="{ width: '500px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="saveNewNomenclature">
      <div class="field">
        <label>Название товара *</label>
        <InputText v-model="form.name" placeholder="Введите название" />
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Техническое название</label>
          <InputText v-model="form.technical_name" placeholder="Опционально" />
        </div>

        <div class="field">
          <label>Артикул</label>
          <InputText v-model="form.article" placeholder="Опционально" />
        </div>

        <div class="field">
          <label>Себестоимость</label>
          <InputNumber 
            v-model="form.current_cost_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>

        <div class="field">
          <label>Цена продажи</label>
          <InputNumber 
            v-model="form.current_sale_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>
      </div>

      <div class="field">
        <label>Фабрика (опционально)</label>
        <div class="field-with-action">
          <Select 
            v-model="form.factory"
            :options="factoriesForNomenclature"
            optionLabel="name"
            optionValue="id"
            placeholder="Не выбрано"
          />
          <Button 
            icon="pi pi-plus" 
            label="Новая"
            size="small"
            @click="openFactoryModal"
            class="action-btn"
          />
        </div>
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button 
          label="Создать товар" 
          icon="pi pi-check" 
          type="submit"
          :disabled="!form.name || store.saving"
          :loading="store.saving"
        />
      </div>
    </form>

    <FactoryModal
      v-if="showFactoryModal"
      v-model:visible="showFactoryModal"
      :factories-store="factoriesStore"
      @created="onFactoryCreated"
    />
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import FactoryModal from './FactoryModal.vue'

const props = defineProps({
  visible: Boolean,
  store: Object
})

const emit = defineEmits(['update:visible', 'created'])

const isVisible = ref(props.visible)
const showFactoryModal = ref(false)

const form = reactive({
  name: '',
  technical_name: '',
  article: '',
  current_cost_price: null,
  current_sale_price: null,
  factory: null,
})

const factoriesStore = props.store.factoriesStore // Access via main store prop or inject

const factoriesForNomenclature = computed(() => {
  const items = factoriesStore.items
  if (!Array.isArray(items)) return []
  return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if(val) {
     // Reset form if needed or keep state
  }
})

watch(isVisible, (val) => emit('update:visible', val))

function openFactoryModal() {
  showFactoryModal.value = true
}

function onFactoryCreated(newFactoryId) {
  form.factory = newFactoryId
}

async function saveNewNomenclature() {
  try {
    const payload = {
      type: 'PRODUCT',
      name: form.name,
      technical_name: form.technical_name || form.name,
      article: form.article || '',
      current_cost_price: Number(form.current_cost_price) || 0,
      current_sale_price: Number(form.current_sale_price) || 0,
      factory: form.factory ? Number(form.factory) : null,
    }
    
    const result = await props.store.createNomenclature(payload)
    
    // Logic to extract ID (simplified from original)
    let newId = result?.id || result?.pk || result?.uuid
    
    if (!newId && result?.data) {
       newId = result.data.id || result.data.pk
    }
    
    // Fallback reload if ID missing
    if (!newId) {
      await props.store.loadNomenclatures()
      const found = props.store.nomenclatures.find(n => n.name === form.name)
      if (found) newId = found.id
    }

    if (newId) {
      emit('created', newId)
      isVisible.value = false
    } else {
      throw new Error('ID not received')
    }
    
  } catch (error) {
    console.error('❌ Error creating nomenclature:', error)
    alert('Ошибка при создании товара')
  }
}
</script>