<template>
  <Dialog
    v-model:visible="isVisible"
    :header="editingItem ? 'Редактирование позиции' : 'Новая позиция проекта'"
    :modal="true"
    :style="{ width: '500px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="submitForm">
      <div class="field">
        <label>Номенклатура *</label>
        <div class="field-with-action">
          <Select 
            v-model="localForm.nomenclature"
            :options="store.nomenclatures"
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите товар"
            class="flex-1"
          />
          <Button 
            icon="pi pi-plus" 
            label="Создать"
            size="small"
            @click="openCreateNomenclature"
          />
        </div>
        <small v-if="store.nomenclatures.length === 0" class="text-muted">
          Нет доступных товаров. Создайте новый.
        </small>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Количество</label>
          <InputNumber 
            v-model="localForm.quantity"
            min="1"
            :useGrouping="false"
          />
        </div>

        <div class="field">
          <label>Себестоимость</label>
          <InputNumber 
            v-model="localForm.fixed_cost_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>

        <div class="field">
          <label>Цена продажи</label>
          <InputNumber 
            v-model="localForm.fixed_sale_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button 
          label="Сохранить" 
          icon="pi pi-check" 
          type="submit"
          :disabled="!localForm.nomenclature"
        />
      </div>
    </form>
    
    <!-- Nested Modal for Nomenclature -->
    <CreateNomenclatureModal
       v-if="showNomenclatureModal"
       v-model:visible="showNomenclatureModal"
       :store="store"
       @created="onNomenclatureCreated"
    />
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import CreateNomenclatureModal from './CreateNomenclatureModal.vue'

const props = defineProps({
  visible: Boolean,
  editingItem: Object,
  store: Object
})

const emit = defineEmits(['update:visible', 'save'])

const isVisible = ref(props.visible)
const showNomenclatureModal = ref(false)

const localForm = reactive({
  nomenclature: null,
  quantity: 1,
  fixed_cost_price: 0,
  fixed_sale_price: 0,
})

watch(() => props.editingItem, (newVal) => {
  if (newVal) {
    localForm.nomenclature = newVal.nomenclature
    localForm.quantity = newVal.quantity
    localForm.fixed_cost_price = newVal.fixed_cost_price
    localForm.fixed_sale_price = newVal.fixed_sale_price
  } else {
    localForm.nomenclature = null
    localForm.quantity = 1
    localForm.fixed_cost_price = 0
    localForm.fixed_sale_price = 0
  }
}, { immediate: true })

watch(() => props.visible, (val) => {
  isVisible.value = val
})

watch(isVisible, (val) => {
  emit('update:visible', val)
})

function submitForm() {
  emit('save', { ...localForm })
}

function openCreateNomenclature() {
  showNomenclatureModal.value = true
}

function onNomenclatureCreated(newId) {
  localForm.nomenclature = newId
}
</script>