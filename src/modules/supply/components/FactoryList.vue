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
/* ============================================
   FACTORY LIST - Светлая тема, полная ширина
   ============================================ */

.factory-list {
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
  max-width: 100%;
}

/* ============================================
   TOOLBAR - Панель инструментов
   ============================================ */
.factory-list__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
  background: #FFFFFF;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #E8ECF2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.factory-list__search {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.factory-list__search-input {
  width: 100%;
  max-width: 100%;
  padding: 9px 16px;
  border: 1px solid #E2E6EE;
  border-radius: 8px;
  font-size: 14px;
  color: #1A1A1A;
  background: #F8F9FA;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.factory-list__search-input::placeholder {
  color: #9AA3B2;
}

.factory-list__search-input:focus {
  outline: none;
  border-color: #2C3E50;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.06);
}

.factory-list__create-btn {
  padding: 10px 24px;
  background: #2C3E50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.factory-list__create-btn::before {
  content: '+';
  font-size: 18px;
  font-weight: 400;
}

.factory-list__create-btn:hover {
  background: #1a2a3a;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.18);
}

.factory-list__create-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.10);
}

/* ============================================
   ТАБЛИЦА
   ============================================ */
.factory-list__table-wrapper {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E8ECF2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.factory-list__table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

.factory-list__table thead {
  background: #F8F9FA;
  border-bottom: 1px solid #E8ECF2;
}

.factory-list__table th {
  padding: 14px 20px;
  text-align: left;
  font-weight: 600;
  color: #1A1A1A;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 2px solid #E8ECF2;
}

.factory-list__table td {
  padding: 14px 20px;
  border-bottom: 1px solid #F0F2F5;
  color: #1A1A1A;
  word-break: break-word;
}

.factory-list__table tbody tr {
  transition: background 0.2s ease;
}

.factory-list__table tbody tr:hover {
  background: #F8F9FA;
}

.factory-list__table tbody tr:last-child td {
  border-bottom: none;
}

/* Ширина колонок */
.factory-list__table th:nth-child(1),
.factory-list__table td:nth-child(1) {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
}

.factory-list__table th:nth-child(2),
.factory-list__table td:nth-child(2) {
  width: 25%;
  min-width: 150px;
}

.factory-list__table th:nth-child(3),
.factory-list__table td:nth-child(3) {
  width: 25%;
  min-width: 150px;
}

.factory-list__table th:nth-child(4),
.factory-list__table td:nth-child(4) {
  width: 25%;
  min-width: 150px;
}

.factory-list__actions-col {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
  text-align: center;
}

.factory-list__actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.factory-list__action-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #6B7A8F;
  line-height: 1;
}

.factory-list__action-btn:hover {
  background: #F0F2F5;
  color: #1A1A1A;
  transform: scale(1.08);
}

.factory-list__action-btn--view:hover {
  background: #E8F0FE;
  color: #2C3E50;
}

.factory-list__action-btn--edit:hover {
  background: #FFF8E7;
  color: #D48C2C;
}

.factory-list__action-btn--danger:hover {
  background: #FEF2F2;
  color: #DC2626;
}

/* ============================================
   СОСТОЯНИЯ
   ============================================ */
.factory-list__loading,
.factory-list__error,
.factory-list__empty {
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E8ECF2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.factory-list__loading {
  color: #6B7A8F;
}

.factory-list__loading::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

.factory-list__error {
  color: #DC2626;
  background: #FEF2F2;
  border-color: #FCA5A5;
}

.factory-list__empty {
  color: #9AA3B2;
}

/* ============================================
   ПАГИНАЦИЯ
   ============================================ */
.factory-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px 0 4px;
  width: 100%;
  max-width: 100%;
}

.factory-list__page-btn {
  padding: 7px 18px;
  border: 1px solid #E2E6EE;
  background: #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1A1A1A;
  font-size: 14px;
  font-weight: 500;
}

.factory-list__page-btn:hover:not(:disabled) {
  border-color: #2C3E50;
  background: #F8F9FA;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.factory-list__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.factory-list__page-info {
  font-size: 14px;
  color: #6B7A8F;
  font-weight: 500;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */

/* Планшеты */
@media (max-width: 992px) {
  .factory-list__table th,
  .factory-list__table td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .factory-list__actions-col {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }
}

/* Мобильные устройства */
@media (max-width: 768px) {
  .factory-list__toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
    border-radius: 10px;
    width: 100%;
  }

  .factory-list__search {
    max-width: 100%;
    width: 100%;
  }

  .factory-list__create-btn {
    width: 100%;
    justify-content: center;
  }

  .factory-list__table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 10px;
    width: 100%;
  }

  .factory-list__table {
    min-width: 650px;
    width: 100%;
  }

  .factory-list__table th,
  .factory-list__table td {
    padding: 10px 14px;
    font-size: 13px;
  }

  .factory-list__actions-col {
    width: 110px;
    min-width: 110px;
    max-width: 110px;
  }
}

/* Маленькие телефоны */
@media (max-width: 480px) {
  .factory-list__toolbar {
    padding: 12px;
    border-radius: 8px;
    gap: 12px;
  }

  .factory-list__search-input {
    font-size: 13px;
    padding: 8px 12px;
  }

  .factory-list__create-btn {
    font-size: 13px;
    padding: 8px 16px;
  }

  .factory-list__table th,
  .factory-list__table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .factory-list__table {
    min-width: 550px;
  }

  .factory-list__action-btn {
    font-size: 14px;
    padding: 4px 7px;
  }

  .factory-list__actions-col {
    width: 90px;
    min-width: 90px;
    max-width: 90px;
  }

  .factory-list__pagination {
    gap: 10px;
    padding: 16px 0 4px;
    flex-wrap: wrap;
  }

  .factory-list__page-btn {
    padding: 5px 14px;
    font-size: 13px;
  }

  .factory-list__page-info {
    font-size: 13px;
  }

  .factory-list__loading,
  .factory-list__error,
  .factory-list__empty {
    padding: 40px 16px;
    font-size: 14px;
    border-radius: 8px;
  }
}

/* ============================================
   АНИМАЦИИ
   ============================================ */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.factory-list__table tbody tr {
  animation: fadeInUp 0.3s ease forwards;
}

.factory-list__table tbody tr:nth-child(1) { animation-delay: 0.02s; }
.factory-list__table tbody tr:nth-child(2) { animation-delay: 0.04s; }
.factory-list__table tbody tr:nth-child(3) { animation-delay: 0.06s; }
.factory-list__table tbody tr:nth-child(4) { animation-delay: 0.08s; }
.factory-list__table tbody tr:nth-child(5) { animation-delay: 0.10s; }
.factory-list__table tbody tr:nth-child(6) { animation-delay: 0.12s; }
.factory-list__table tbody tr:nth-child(7) { animation-delay: 0.14s; }
.factory-list__table tbody tr:nth-child(8) { animation-delay: 0.16s; }
.factory-list__table tbody tr:nth-child(9) { animation-delay: 0.18s; }
.factory-list__table tbody tr:nth-child(10) { animation-delay: 0.20s; }

/* ============================================
   ДОПОЛНИТЕЛЬНО
   ============================================ */
.factory-list__action-btn[title="Просмотр"]:hover {
  background: #E8F0FE;
  color: #2C3E50;
}

.factory-list__action-btn[title="Редактировать"]:hover {
  background: #FFF8E7;
  color: #D48C2C;
}

.factory-list__action-btn[title="Удалить"]:hover {
  background: #FEF2F2;
  color: #DC2626;
}
</style>