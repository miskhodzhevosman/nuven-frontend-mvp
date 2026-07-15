<template>
  <Card class="items-card">
    <template #title>
      <div class="card-header">
        <div>
          <h2 class="card-title">Позиции проекта</h2>
          <p class="card-subtitle">Товары, количество и сумма продаж</p>
        </div>
        <Button 
          label="Добавить позицию" 
          icon="pi pi-plus"
          @click="openCreateItem" 
        />
      </div>
    </template>
    <template #content>
      <div v-if="itemsRows.length" class="table-wrap">
        <DataTable 
          :value="itemsRows" 
          dataKey="id"
          class="p-datatable-sm"
          stripedRows
        >
          <Column field="nomenclature_name" header="Товар" style="min-width: 150px">
            <template #body="{ data }">
              <strong>{{ data.nomenclature_name }}</strong>
            </template>
          </Column>

          <Column field="quantity" header="Кол-во" style="width: 100px" />

          <Column field="fixed_cost_price" header="Себестоимость" style="width: 150px">
            <template #body="{ data }">
              {{ formatMoney(data.fixed_cost_price) }}
            </template>
          </Column>

          <Column field="fixed_sale_price" header="Цена продажи" style="width: 150px">
            <template #body="{ data }">
              {{ formatMoney(data.fixed_sale_price) }}
            </template>
          </Column>

          <Column field="total_amount" header="Сумма" style="width: 150px">
            <template #body="{ data }">
              <span class="text-positive">{{ formatMoney(data.total_amount) }}</span>
            </template>
          </Column>

          <Column header="Действия" style="width: 180px">
            <template #body="{ data }">
              <div class="table-actions">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-rounded p-button-sm p-button-text" 
                  @click="openEditItem(data)"
                  tooltip="Редактировать"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                  @click="handleDelete(data.id)"
                  :loading="isDeleting(data.id)"
                  tooltip="Удалить"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="empty-state">
        <i class="pi pi-box" style="font-size: 2rem; color: #9AA0A6;"></i>
        <h4>Позиции ещё не добавлены</h4>
        <p>Создайте первую позицию для этого проекта</p>
      </div>
    </template>
  </Card>

  <!-- Item Modal Component -->
  <ItemModal
    v-model:visible="showItemModal"
    :editing-item="editingItem"
    :store="store"
    @save="handleSaveItem"
  />
</template>

<script setup>
import { ref, reactive } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ItemModal from './modals/ItemModal.vue' // Создадим ниже

const props = defineProps({
  itemsRows: Array,
  formatMoney: Function,
  store: Object, // Access to store for actions
  refreshAllData: Function
})

const showItemModal = ref(false)
const editingItem = ref(null)
const itemForm = reactive({
  nomenclature: null,
  quantity: 1,
  fixed_cost_price: 0,
  fixed_sale_price: 0,
})

function openCreateItem() {
  editingItem.value = null
  itemForm.nomenclature = null
  itemForm.quantity = 1
  itemForm.fixed_cost_price = 0
  itemForm.fixed_sale_price = 0
  showItemModal.value = true
}

function openEditItem(item) {
  editingItem.value = item
  itemForm.nomenclature = item.nomenclature
  itemForm.quantity = item.quantity
  itemForm.fixed_cost_price = item.fixed_cost_price
  itemForm.fixed_sale_price = item.fixed_sale_price
  showItemModal.value = true
}

async function handleSaveItem(formData) {
  try {
    if (editingItem.value) {
      await props.store.updateProjectItem(editingItem.value.id, formData)
    } else {
      await props.store.createProjectItem({
        project: props.store.currentProject?.id, // Assuming we can get ID or pass it
        ...formData
      })
    }
    showItemModal.value = false
    await props.refreshAllData()
  } catch (error) {
    console.error('Error saving item:', error)
    alert('Ошибка при сохранении позиции')
  }
}

async function handleDelete(id) {
  if (!confirm('Удалить позицию?')) return
  try {
    await props.store.deleteProjectItem(id)
    await props.refreshAllData()
  } catch (error) {
    console.error('Error deleting item:', error)
    alert('Ошибка при удалении позиции')
  }
}

function isDeleting(id) {
  return props.store.deletingProjectItemId === id
}
</script>