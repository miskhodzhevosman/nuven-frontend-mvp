<template>
  <Dialog
    v-model:visible="isVisible"
    header="Оплата фабрике"
    :modal="true"
    :style="{ width: '450px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="submitForm">
      <div class="field">
        <label>Фабрика</label>
        <div class="field-with-action">
          <Select 
            v-model="form.counterparty"
            :options="factories"
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите фабрику"
            :disabled="factoriesStore.loading"
            class="flex-1"
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

      <div class="form-grid">
        <div class="field">
          <label>Дата</label>
          <DatePicker 
            v-model="form.date"
            dateFormat="dd.mm.yy"
            :showIcon="true"
          />
        </div>

        <div class="field">
          <label>Сумма</label>
          <InputNumber 
            v-model="form.amount"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button label="Сохранить" icon="pi pi-check" type="submit" />
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
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import FactoryModal from './FactoryModal.vue'

const props = defineProps({
  visible: Boolean,
  factories: Array,
  factoriesStore: Object
})

const emit = defineEmits(['update:visible', 'save'])

const isVisible = ref(props.visible)
const showFactoryModal = ref(false)

const form = reactive({
  counterparty: null,
  date: null,
  amount: null
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if (val) {
    form.counterparty = null
    form.date = null
    form.amount = null
  }
})

watch(isVisible, (val) => emit('update:visible', val))

function openFactoryModal() {
  showFactoryModal.value = true
}

function onFactoryCreated(newId) {
  form.counterparty = newId
}

function submitForm() {
  emit('save', { ...form })
}
</script>