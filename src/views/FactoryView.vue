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
  background: #0E0F12;
  min-height: 100vh;
  color: #D0D2D5;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #16181C;
  border-radius: 12px;
}

h1 {
  margin: 0;
  color: #C9A86A;
}

/* BUTTON */
.btn {
  background: #C9A86A;
  border: none;
  color: #0E0F12;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s ease;
}

.btn:hover {
  filter: brightness(1.1);
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 10px;
}

.link {
  background: none;
  border: none;
  color: #C9A86A;
  cursor: pointer;
}

.link:hover {
  color: #D0D2D5;
}

.danger {
  background: none;
  border: none;
  color: #C96A6A;
  cursor: pointer;
}

.danger:hover {
  color: #ff8a8a;
}
</style>