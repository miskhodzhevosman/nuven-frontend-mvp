<template>
  <Dialog
    v-model:visible="isVisible"
    header="Новый проектный расход"
    :modal="true"
    :style="{ width: '500px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="submitForm">
      
      <!-- Выбор или создание Типа Расхода -->
      <div class="field">
        <label for="expense-type">Тип расхода (Описание)</label>
        <AutoComplete
          id="expense-type"
          v-model="selectedType"
          :suggestions="filteredTypes"
          @complete="searchTypes"
          field="name"
          placeholder="Например: Бензин, Ткань, Доставка"
          dropdown
          forceSelection
          :loading="typesLoading"
        >
          <template #empty>
            <div class="p-autocomplete-empty-message">
              Не найдено. Будет создан новый тип: "{{ searchQuery }}"
            </div>
          </template>
        </AutoComplete>
        <small class="text-secondary">Выберите из списка или введите новое название</small>
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

      <div class="modal-actions flex justify-end gap-2 mt-4">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button label="Сохранить" icon="pi pi-check" type="submit" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import { useFinanceStore } from '@/stores/finance.store'
import { createOperationType } from '@/services/finance.service'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'save'])

const financeStore = useFinanceStore()
const isVisible = ref(props.visible)
const saving = ref(false)

const form = reactive({
  date: null,
  amount: null
})

const selectedType = ref(null)
const searchQuery = ref('')

const allTypes = computed(() => financeStore.operationTypes || [])
const typesLoading = computed(() => financeStore.typesLoading)

const filteredTypes = ref([])

watch(() => props.visible, async (val) => {
  isVisible.value = val
  if (val) {
    form.date = new Date()
    form.amount = null
    selectedType.value = null
    searchQuery.value = ''
    
    if (!financeStore.operationTypesLoaded) {
      try {
        await financeStore.fetchOperationTypes()
      } catch (e) {
        console.error("Не удалось загрузить типы операций", e)
      }
    }
  }
})

watch(isVisible, (val) => emit('update:visible', val))

function searchTypes(event) {
  searchQuery.value = event.query
  const query = event.query.toLowerCase()
  
  const projectExpenseTypes = allTypes.value.filter(t => t.code === 'project_expense')
  
  if (!query) {
    filteredTypes.value = projectExpenseTypes
  } else {
    filteredTypes.value = projectExpenseTypes.filter(t => 
      t.name.toLowerCase().includes(query)
    )
  }
}

async function submitForm() {
  if (!form.amount || !form.date) {
    alert('Заполните дату и сумму')
    return
  }

  let operationTypeId = null

  saving.value = true

  try {
    // Логика определения ID
    if (selectedType.value && typeof selectedType.value === 'object' && selectedType.value.id) {
      // Выбран существующий
      operationTypeId = selectedType.value.id
    } else {
      // Введена новая строка
      const newName = typeof selectedType.value === 'string' ? selectedType.value : searchQuery.value
      
      if (!newName || !newName.trim()) {
        throw new Error('Укажите описание расхода')
      }

      // Проверяем дубликаты
      const existing = allTypes.value.find(
        t => t.code === 'project_expense' && t.name.toLowerCase() === newName.trim().toLowerCase()
      )

      if (existing) {
        operationTypeId = existing.id
      } else {
        // Создаем новый тип
        const createdType = await createOperationType({
          name: newName.trim(),
          code: 'project_expense'
        })
        
        // Добавляем новый тип в стор сразу
        financeStore.operationTypes.push(createdType)
        
        operationTypeId = createdType.id
      }
    }

    emit('save', {
      amount: form.amount,
      date: form.date,
      operationTypeId: operationTypeId
    })

    emit('update:visible', false)

  } catch (e) {
    console.error(e)
    const backendError = e.response?.data 
    const message = backendError 
        ? (typeof backendError === 'string' ? backendError : JSON.stringify(backendError)) 
        : (e.message || 'Ошибка сохранения')
    alert(message)
  } finally {
    saving.value = false
  }
}
</script>