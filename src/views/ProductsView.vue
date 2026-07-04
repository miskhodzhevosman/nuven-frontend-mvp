<template>
  <div class="products-page">
    <div class="page-header">
      <h1>Товары</h1>

      <button class="primary-btn" @click="openCreateModal">
        + Создать товар
      </button>
    </div>

    <Table
      :columns="columns"
      :rows="store.tableRows"
      :loading="store.loading"
      row-key="id"
    >
      <template #cell-factory_name="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell-current_cost_price="{ value }">
        {{ formatPrice(value) }}
      </template>

      <template #cell-current_sale_price="{ value }">
        {{ formatPrice(value) }}
      </template>

      <template #actions="{ row }">
        <div class="actions">
          <button class="secondary-btn" @click="openEditModal(row)">
            Редактировать
          </button>

          <button
            class="danger-btn"
            :disabled="store.deletingId === row.id"
            @click="handleDelete(row)"
          >
            {{ store.deletingId === row.id ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </template>
    </Table>

    <!-- Модалка -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Редактировать товар' : 'Создать товар' }}</h2>
          <button class="icon-btn" @click="closeModal">✕</button>
        </div>

        <form class="product-form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Название *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Введите название"
                required
              />
            </div>

            <div class="form-group">
              <label for="technical_name">Техническое название</label>
              <input
                id="technical_name"
                v-model="form.technical_name"
                type="text"
                placeholder="Введите техническое название"
              />
            </div>

            <div class="form-group">
              <label for="article">Артикул</label>
              <input
                id="article"
                v-model="form.article"
                type="text"
                placeholder="Введите артикул"
              />
            </div>

            <div class="form-group">
              <label for="factory">Фабрика *</label>
              <select
                id="factory"
                v-model="form.factory"
                required
              >
                <option disabled value="">Выберите фабрику</option>
                <option
                  v-for="factory in store.factories"
                  :key="factory.id"
                  :value="factory.id"
                >
                  {{ factory.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="current_cost_price">Закупка</label>
              <input
                id="current_cost_price"
                v-model="form.current_cost_price"
                type="text"
                placeholder="Например 1000"
              />
            </div>

            <div class="form-group">
              <label for="current_sale_price">Продажа</label>
              <input
                id="current_sale_price"
                v-model="form.current_sale_price"
                type="text"
                placeholder="Например 1500"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="form-error">
            {{ errorMessage }}
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">
              Отмена
            </button>

            <button type="submit" class="primary-btn" :disabled="store.saving">
              {{ store.saving ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import Table from '@/components/Table.vue'
import { useProductsStore } from '@/stores/products'

const store = useProductsStore()

const columns = [
  { key: 'name', label: 'Товар' },
  { key: 'factory_name', label: 'Фабрика' },
  { key: 'current_cost_price', label: 'Закупка' },
  { key: 'current_sale_price', label: 'Продажа' },
]

const showModal = ref(false)
const editingId = ref(null)
const errorMessage = ref('')

const isEditMode = computed(() => editingId.value !== null)

const getInitialForm = () => ({
  type: 'PRODUCT',
  name: '',
  technical_name: '',
  article: '',
  current_cost_price: '',
  current_sale_price: '',
  factory: '',
})

const form = reactive(getInitialForm())

function resetForm() {
  Object.assign(form, getInitialForm())
  editingId.value = null
  errorMessage.value = ''
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

function openEditModal(row) {
  errorMessage.value = ''
  editingId.value = row.id

  Object.assign(form, {
    type: row.type || 'PRODUCT',
    name: row.name || '',
    technical_name: row.technical_name || '',
    article: row.article || '',
    current_cost_price: row.current_cost_price ?? '',
    current_sale_price: row.current_sale_price ?? '',
    factory: row.factory ?? '',
  })

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function normalizePayload() {
  return {
    type: 'PRODUCT',
    name: form.name.trim(),
    technical_name: form.technical_name?.trim() || '',
    article: form.article?.trim() || '',
    current_cost_price:
      form.current_cost_price === '' ? '' : String(form.current_cost_price),
    current_sale_price:
      form.current_sale_price === '' ? '' : String(form.current_sale_price),
    factory: Number(form.factory),
  }
}

async function handleSubmit() {
  errorMessage.value = ''

  try {
    const payload = normalizePayload()

    if (!payload.name) {
      errorMessage.value = 'Введите название товара'
      return
    }

    if (!payload.factory && payload.factory !== 0) {
      errorMessage.value = 'Выберите фабрику'
      return
    }

    if (isEditMode.value) {
      await store.updateProduct(editingId.value, payload)
    } else {
      await store.createProduct(payload)
    }

    closeModal()
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.detail ||
      'Не удалось сохранить товар'
  }
}

async function handleDelete(row) {
  const confirmed = window.confirm(`Удалить товар "${row.name}"?`)
  if (!confirmed) return

  try {
    await store.deleteProduct(row.id)
  } catch (error) {
    alert(error?.response?.data?.detail || 'Не удалось удалить товар')
  }
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

onMounted(async () => {
  try {
    await store.init()
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error)
  }
})
</script>

<style scoped>
.products-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn,
.danger-btn,
.icon-btn {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
  padding: 10px 14px;
}

.primary-btn:hover {
  opacity: 0.92;
}

.secondary-btn {
  background: #e5e7eb;
  color: #111827;
  padding: 8px 12px;
}

.secondary-btn:hover {
  opacity: 0.9;
}

.danger-btn {
  background: #dc2626;
  color: #fff;
  padding: 8px 12px;
}

.danger-btn:hover {
  opacity: 0.9;
}

.danger-btn:disabled,
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-btn {
  background: transparent;
  font-size: 18px;
  padding: 4px 8px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 760px;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select {
  min-height: 42px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2563eb;
}

.form-error {
  color: #dc2626;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .products-page {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>