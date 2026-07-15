<template>
  <Dialog
    v-model:visible="isVisible"
    :header="title"
    :modal="true"
    :style="{ width: '400px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="submitForm">
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
import Button from 'primevue/button'

const props = defineProps({
  visible: Boolean,
  title: String
})

const emit = defineEmits(['update:visible', 'save'])

const isVisible = ref(props.visible)
const form = reactive({
  date: null,
  amount: null
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if (val) {
    form.date = null
    form.amount = null
  }
})

watch(isVisible, (val) => emit('update:visible', val))

function submitForm() {
  emit('save', { ...form })
}
</script>