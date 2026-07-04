<template>
  <div class="page">
    <div class="header">
      <h1>Фабрики</h1>

      <button class="btn" @click="openCreate">
        + Добавить фабрику
      </button>
    </div>

    <Table
      :columns="columns"
      :rows="store.items"
      :loading="store.loading"
      row-key="id"
    >
      <template #actions="{ row }">
        <div class="actions">
          <button class="link" @click="openEdit(row)">Редактировать</button>
          <button class="danger" @click="store.deleteFactory(row.id)">
            Удалить
          </button>
        </div>
      </template>
    </Table>

    <FactoryForm
  v-if="formVisible"
  :factory="selected"
  @save="saveFactory"
  @close="closeForm"
/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Table from '@/components/Table.vue'
import FactoryForm from '@/components/FactoryForm.vue'
import { useFactoriesStore } from '@/stores/factories.store'

function closeForm() {
  formVisible.value = false
  selected.value = null
}


const store = useFactoriesStore()

const formVisible = ref(false)
const selected = ref(null)

const columns = [
  { key: 'name', label: 'Название' },
  { key: 'address', label: 'Город' }
]

function openCreate() {
  selected.value = null
  formVisible.value = true
}

function openEdit(row) {
  selected.value = row
  formVisible.value = true
}

async function saveFactory(data) {
  if (data.id) {
    await store.updateFactory(data.id, data)
  } else {
    await store.createFactory(data)
  }
  closeForm()
}

onMounted(() => {
  store.fetchFactories()
})
</script>

<style scoped>
.page {
  padding: 24px;
  background: #121212;
  min-height: 100vh;
  color: #e5e5e5;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 10px;
}

.link {
  background: none;
  border: none;
  color: #7aa2ff;
  cursor: pointer;
}

.danger {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
}
</style>