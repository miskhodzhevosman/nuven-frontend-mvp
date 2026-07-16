<template>
  <Dialog
    v-model:visible="isVisible"
    :header="title"
    :modal="true"
    :style="{ width: '450px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="submitForm">
      
      <!-- Описание расхода -->
      <div class="field">
        <label for="name">Описание расхода</label>
        <InputText 
          id="name"
          v-model="form.name" 
          placeholder="Например: Закупка ткани, Доставка"
          required
        />
      </div>

      <!-- Дата -->
      <div class="field">
        <label for="date">Дата</label>
        <DatePicker 
          id="date"
          v-model="form.date"
          dateFormat="dd.mm.yy"
          :showIcon="true"
          required
        />
      </div>

      <!-- Сумма -->
      <div class="field">
        <label for="amount">Сумма</label>
        <InputNumber 
          id="amount"
          v-model="form.amount"
          mode="currency"
          currency="CNY"
          locale="ru-RU"
          min="0"
          required
        />
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button label="Сохранить" icon="pi pi-check" type="submit" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps({
  visible: Boolean,
  title: String
})

const emit = defineEmits(['update:visible', 'save'])

const isVisible = ref(props.visible)
const form = reactive({
  name: '',
  date: null,
  amount: null
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if (val) {
    form.name = ''
    form.date = null
    form.amount = null
  }
})

watch(isVisible, (val) => emit('update:visible', val))

function submitForm() {
  emit('save', { ...form })
}
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>