<!-- src/modules/supply/components/FactoryList.vue -->
<template>
  <div class="factory-list">
    <div class="factory-list__toolbar">
      <div class="factory-list__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию..."
          @input="onSearch"
          class="factory-list__search-input"
        />
      </div>
      <button @click="onCreate" class="factory-list__create-btn">
        + Добавить фабрику
      </button>
    </div>

    <div v-if="loading" class="factory-list__loading">
      Загрузка...
    </div>

    <div v-else-if="error" class="factory-list__error">
      {{ error }}
    </div>

    <div v-else-if="!factories.length" class="factory-list__empty">
      Нет фабрик. Создайте первую!
    </div>

    <table v-else class="factory-list__table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Адрес</th>
          <th>Контакты</th>
          <th class="factory-list__actions-col">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="factory in factories" :key="factory.id">
          <td>{{ factory.id }}</td>
          <td>{{ factory.name }}</td>
          <td>{{ factory.address || '-' }}</td>
          <td>{{ factory.contacts || '-' }}</td>
          <td class="factory-list__actions">
            <button @click="onView(factory)" class="factory-list__action-btn" title="Просмотр">
              👁️
            </button>
            <button @click="onEdit(factory)" class="factory-list__action-btn" title="Редактировать">
              ✏️
            </button>
            <button @click="onDelete(factory)" class="factory-list__action-btn factory-list__action-btn--danger" title="Удалить">
              🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 0" class="factory-list__pagination">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="factory-list__page-btn"
      >
        ←
      </button>
      <span class="factory-list__page-info">
        Страница {{ currentPage }} из {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="factory-list__page-btn"
      >
        →
      </button>
    </div>

    <!-- Модалки -->
    <FactoryCreateModal
      v-if="showCreateModal"
      @close="closeCreateModal"
      @created="handleCreated"
    />

    <FactoryEditModal
      v-if="showEditModal && selectedFactory"
      :factory="selectedFactory"
      @close="closeEditModal"
      @updated="handleUpdated"
    />

    <FactoryViewModal
      v-if="showViewModal && selectedFactory"
      :factory="selectedFactory"
      @close="closeViewModal"
    />

    <FactoryDeleteModal
      v-if="showDeleteModal && selectedFactory"
      :factory="selectedFactory"
      @close="closeDeleteModal"
      @deleted="handleDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSupplyStore } from '@/modules/supply/store'
import { storeToRefs } from 'pinia'
import FactoryCreateModal from './FactoryCreateModal.vue'
import FactoryEditModal from './FactoryEditModal.vue'
import FactoryViewModal from './FactoryViewModal.vue'
import FactoryDeleteModal from './FactoryDeleteModal.vue'

const store = useSupplyStore()
const { factories, loading, error, totalFactories, currentPage, pageSize } = storeToRefs(store)

const searchQuery = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const selectedFactory = ref(null)

const totalPages = computed(() => Math.ceil(totalFactories.value / pageSize.value))

// Загрузка данных
const loadData = async () => {
  await store.fetchFactories({ search: searchQuery.value })
}

// Поиск с debounce
let searchTimeout = null
const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.setPage(1)
    loadData()
  }, 500)
}

// Пагинация
const prevPage = () => {
  if (currentPage.value > 1) {
    store.setPage(currentPage.value - 1)
    loadData()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    store.setPage(currentPage.value + 1)
    loadData()
  }
}

// Действия
const onCreate = () => {
  showCreateModal.value = true
}

const onEdit = (factory) => {
  selectedFactory.value = factory
  showEditModal.value = true
}

const onView = (factory) => {
  selectedFactory.value = factory
  showViewModal.value = true
}

const onDelete = (factory) => {
  selectedFactory.value = factory
  showDeleteModal.value = true
}

// Обработчики модалок
const closeCreateModal = () => {
  showCreateModal.value = false
}

const handleCreated = () => {
  closeCreateModal()
  loadData()
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedFactory.value = null
}

const handleUpdated = () => {
  closeEditModal()
  loadData()
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedFactory.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedFactory.value = null
}

const handleDeleted = () => {
  closeDeleteModal()
  loadData()
}

// Initial load
loadData()
</script>

<style scoped>
.factory-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.factory-list__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.factory-list__search {
  flex: 1;
  min-width: 200px;
}

.factory-list__search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.factory-list__search-input:focus {
  outline: none;
  border-color: #1890ff;
}

.factory-list__create-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.3s;
}

.factory-list__create-btn:hover {
  background: #40a9ff;
}

.factory-list__table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.factory-list__table th,
.factory-list__table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.factory-list__table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

.factory-list__table tr:hover {
  background: #f5f5f5;
}

.factory-list__actions-col {
  width: 120px;
  text-align: center;
}

.factory-list__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.factory-list__action-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.3s;
}

.factory-list__action-btn:hover {
  background: #e6f7ff;
}

.factory-list__action-btn--danger:hover {
  background: #fff1f0;
}

.factory-list__loading,
.factory-list__error,
.factory-list__empty {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
}

.factory-list__error {
  color: #ff4d4f;
}

.factory-list__empty {
  color: #999;
}

.factory-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
}

.factory-list__page-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.factory-list__page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.factory-list__page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.factory-list__page-info {
  font-size: 14px;
  color: #666;
}
</style>