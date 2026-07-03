<template>
  <div>
    <h1>Factories</h1>

    <button @click="openCreateForm">
      Добавить фабрику
    </button>

    <!-- Модалка -->
    <div v-if="showForm" class="modal-overlay" @click="handleCancel">
      <div class="modal-content" @click.stop>
        <FactoryForm
          :factory="selectedFactory"
          @success="handleSuccess"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <Table
      :columns="columns"
      :rows="store.factories"
      :loading="store.loading"
      row-key="id"
    >
      <template #actions="{ row }">
        <button @click="openEditForm(row)">Редактировать</button>
        <button @click="handleDelete(row)">Удалить</button>
      </template>
    </Table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useSuppliesStore } from '@/stores/factoryStore'
import Table from '@/components/Table.vue'
import FactoryForm from '@/components/FactoryForm.vue'

const store = useSuppliesStore()

const showForm = ref(false)
const selectedFactory = ref(null)

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Название' },
  { key: 'address', label: 'Адрес' }
]

const openCreateForm = () => {
  selectedFactory.value = null
  showForm.value = true
}

const openEditForm = (factory) => {
  selectedFactory.value = { ...factory }
  showForm.value = true
}

const handleSuccess = () => {
  showForm.value = false
  selectedFactory.value = null
}

const handleCancel = () => {
  showForm.value = false
  selectedFactory.value = null
}

const handleDelete = async (factory) => {
  const isConfirmed = window.confirm(
    `Удалить фабрику "${factory.name}"?`
  )

  if (!isConfirmed) return

  try {
    await store.deleteFactory(factory.id)
  } catch (error) {
    console.error('Не удалось удалить фабрику', error)
  }
}

onMounted(() => {
  store.fetchFactories()
})
</script>

<style scoped>
h3 {color: #f3f4f6;}

.modal-overlay {
  position: fixed;
  inset: 0; /* top:0 right:0 bottom:0 left:0 */
  background: rgba(0, 0, 0, 0.45);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 1000;
}

.modal-content {
  background: rgb(29, 27, 27);
  border-radius: 12px;
  padding: 24px;
  min-width: 420px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  color: #f3f4f6;
}
</style>