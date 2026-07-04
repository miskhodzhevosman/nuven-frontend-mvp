<template>
  <div class="project-details-page">
    <div class="page-header">
      <div>
        <button class="back-btn" @click="goBack">← Назад к проектам</button>
        <h1>{{ projectInfo?.name || 'Проект' }}</h1>
      </div>
    </div>

    <div v-if="store.detailsLoading" class="loading-state">
      Загрузка проекта...
    </div>

    <template v-else-if="projectInfo">
      <!-- Информация о проекте -->
      <section class="card">
        <div class="section-header">
          <h2>Информация о проекте</h2>

          <button class="primary-btn" @click="openEditProjectModal">
            Редактировать проект
          </button>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Статус</span>
            <span class="value">{{ projectInfo.status_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Клиент</span>
            <span class="value">{{ projectInfo.client_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Менеджер</span>
            <span class="value">{{ projectInfo.manager_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">География</span>
            <span class="value">{{ projectInfo.geography || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Создан</span>
            <span class="value">{{ formatDate(projectInfo.created_at) }}</span>
          </div>
        </div>
      </section>

      <!-- Экономика -->
      <section class="card">
        <h2>Экономика проекта</h2>

        <table class="economy-table">
          <tbody>
            <tr>
              <td>Выручка</td>
              <td>{{ formatMoney(finance?.revenue) }}</td>
            </tr>
            <tr>
              <td>Себестоимость</td>
              <td>{{ formatMoney(finance?.cost_price) }}</td>
            </tr>
            <tr>
              <td>Валовая прибыль</td>
              <td>{{ formatMoney(finance?.gross_profit) }}</td>
            </tr>
            <tr>
              <td>Маржа</td>
              <td>{{ finance?.margin ?? '—' }}{{ finance?.margin !== undefined ? '%' : '' }}</td>
            </tr>
            <tr>
              <td>Получено от клиента</td>
              <td>{{ formatMoney(finance?.received_from_client) }}</td>
            </tr>
            <tr>
              <td>Дебиторика</td>
              <td>{{ formatMoney(finance?.accounts_receivable) }}</td>
            </tr>
            <tr>
              <td>Оплачено фабрикам</td>
              <td>{{ formatMoney(finance?.paid_to_factories) }}</td>
            </tr>
            <tr>
              <td>Кредиторика</td>
              <td>{{ formatMoney(finance?.accounts_payable) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Доступ -->
      <section class="card">
        <h2>Доступ к проекту</h2>
        <div class="access-row">
          {{ projectInfo.manager_name || '—' }}
        </div>
      </section>

      <!-- Позиции -->
      <section class="card">
        <div class="section-header">
          <h2>Позиции</h2>

          <button class="primary-btn" @click="openCreateItemModal">
            + Добавить позицию
          </button>
        </div>

        <Table
          :columns="itemsColumns"
          :rows="store.currentProjectItemsRows"
          :loading="store.detailsLoading"
          row-key="id"
        >
          <template #cell-nomenclature_name="{ value }">
            {{ value || '—' }}
          </template>

          <template #cell-quantity="{ value }">
            {{ value || '—' }}
          </template>

          <template #cell-total_amount="{ value }">
            {{ formatMoney(value) }}
          </template>

          <template #actions="{ row }">
            <div class="actions">
              <button class="secondary-btn" @click="openEditItemModal(row)">
                Редактировать
              </button>

              <button
                class="danger-btn"
                :disabled="store.deletingProjectItemId === row.id"
                @click="handleDeleteItem(row)"
              >
                {{ store.deletingProjectItemId === row.id ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </template>
        </Table>
      </section>
    </template>

    <div v-else class="empty-state">
      Проект не найден
    </div>

    <!-- ===================== -->
    <!-- МОДАЛКА РЕДАКТИРОВАНИЯ ПРОЕКТА -->
    <!-- ===================== -->
    <div v-if="showProjectModal" class="modal-overlay" @click.self="closeProjectModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Редактировать проект</h2>
          <button class="icon-btn" @click="closeProjectModal">✕</button>
        </div>

        <form class="project-form" @submit.prevent="handleUpdateProject">
          <div class="form-grid">
            <div class="form-group">
              <label for="project-name">Название проекта *</label>
              <input
                id="project-name"
                v-model="projectForm.name"
                type="text"
                required
              />
            </div>

            <div class="form-group">
              <label for="project-geography">География</label>
              <input
                id="project-geography"
                v-model="projectForm.geography"
                type="text"
              />
            </div>

            <div class="form-group">
              <label for="project-client">Клиент *</label>
              <select id="project-client" v-model="projectForm.client" required>
                <option disabled value="">Выберите клиента</option>
                <option
                  v-for="client in store.clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="project-manager">Тех. менеджер *</label>
              <select id="project-manager" v-model="projectForm.tech_manager" required>
                <option disabled value="">Выберите менеджера</option>
                <option
                  v-for="manager in store.managers"
                  :key="manager.id"
                  :value="manager.id"
                >
                  {{ manager.full_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="project-status">Статус *</label>
              <select id="project-status" v-model="projectForm.status" required>
                <option disabled value="">Выберите статус</option>
                <option
                  v-for="status in store.statuses"
                  :key="status.id"
                  :value="status.id"
                >
                  {{ status.name }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="projectError" class="form-error">
            {{ projectError }}
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeProjectModal">
              Отмена
            </button>

            <button type="submit" class="primary-btn" :disabled="store.saving">
              {{ store.saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================== -->
    <!-- МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ПОЗИЦИИ -->
    <!-- ===================== -->
    <div v-if="showItemModal" class="modal-overlay" @click.self="closeItemModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEditItemMode ? 'Редактировать позицию' : 'Добавить позицию' }}</h2>
          <button class="icon-btn" @click="closeItemModal">✕</button>
        </div>

        <form class="project-form" @submit.prevent="handleSubmitItem">
          <div class="form-grid">
            <div class="form-group">
              <label for="item-nomenclature">Товар *</label>
              <select id="item-nomenclature" v-model="itemForm.nomenclature" required>
                <option disabled value="">Выберите товар</option>
                <option
                  v-for="item in store.nomenclatures"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="item-quantity">Количество *</label>
              <input
                id="item-quantity"
                v-model="itemForm.quantity"
                type="text"
                required
                placeholder="Например 10"
              />
            </div>

            <div class="form-group">
              <label for="item-cost-price">Себестоимость</label>
              <input
                id="item-cost-price"
                v-model="itemForm.fixed_cost_price"
                type="text"
                placeholder="Например 1000"
              />
            </div>

            <div class="form-group">
              <label for="item-sale-price">Продажная цена</label>
              <input
                id="item-sale-price"
                v-model="itemForm.fixed_sale_price"
                type="text"
                placeholder="Например 1500"
              />
            </div>
          </div>

          <div v-if="itemError" class="form-error">
            {{ itemError }}
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeItemModal">
              Отмена
            </button>

            <button type="submit" class="primary-btn" :disabled="store.saving">
              {{ store.saving ? 'Сохранение...' : (isEditItemMode ? 'Сохранить' : 'Добавить') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Table from '@/components/Table.vue'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = computed(() => Number(route.params.id))
const projectInfo = computed(() => store.currentProjectInfo)
const finance = computed(() => store.currentProjectFinance)

const itemsColumns = [
  { key: 'nomenclature_name', label: 'Товар' },
  { key: 'quantity', label: 'Кол-во' },
  { key: 'total_amount', label: 'Сумма' },
]

/* =========================
   РЕДАКТИРОВАНИЕ ПРОЕКТА
========================= */
const showProjectModal = ref(false)
const projectError = ref('')

const projectForm = reactive({
  name: '',
  geography: '',
  client: '',
  tech_manager: '',
  status: '',
})

function openEditProjectModal() {
  if (!projectInfo.value) return

  projectError.value = ''

  projectForm.name = projectInfo.value.name || ''
  projectForm.geography = projectInfo.value.geography || ''
  projectForm.client = projectInfo.value.client ?? ''
  projectForm.tech_manager = projectInfo.value.tech_manager ?? ''
  projectForm.status = projectInfo.value.status ?? ''

  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
  projectError.value = ''
}

async function handleUpdateProject() {
  projectError.value = ''

  try {
    const payload = {
      name: projectForm.name.trim(),
      geography: projectForm.geography.trim(),
      client: Number(projectForm.client),
      tech_manager: Number(projectForm.tech_manager),
      status: Number(projectForm.status),
    }

    if (!payload.name) {
      projectError.value = 'Введите название проекта'
      return
    }

    await store.updateProject(projectId.value, payload)
    closeProjectModal()
  } catch (error) {
    projectError.value =
      error?.response?.data?.detail || 'Не удалось сохранить проект'
  }
}

/* =========================
   CRUD ПОЗИЦИЙ ПРОЕКТА
========================= */
const showItemModal = ref(false)
const itemError = ref('')
const editingItemId = ref(null)

const itemForm = reactive({
  quantity: '',
  fixed_cost_price: '',
  fixed_sale_price: '',
  project: '',
  nomenclature: '',
})

const isEditItemMode = computed(() => editingItemId.value !== null)

function getInitialItemForm() {
  return {
    quantity: '',
    fixed_cost_price: '',
    fixed_sale_price: '',
    project: projectId.value,
    nomenclature: '',
  }
}

function resetItemForm() {
  Object.assign(itemForm, getInitialItemForm())
  editingItemId.value = null
  itemError.value = ''
}

function openCreateItemModal() {
  resetItemForm()
  showItemModal.value = true
}

function openEditItemModal(row) {
  itemError.value = ''
  editingItemId.value = row.id

  Object.assign(itemForm, {
    quantity: row.quantity ?? '',
    fixed_cost_price: row.fixed_cost_price ?? '',
    fixed_sale_price: row.fixed_sale_price ?? '',
    project: row.project ?? projectId.value,
    nomenclature: row.nomenclature ?? '',
  })

  showItemModal.value = true
}

function closeItemModal() {
  showItemModal.value = false
  resetItemForm()
}

function normalizeItemPayload() {
  return {
    quantity: itemForm.quantity === '' ? '' : String(itemForm.quantity),
    fixed_cost_price:
      itemForm.fixed_cost_price === '' ? '' : String(itemForm.fixed_cost_price),
    fixed_sale_price:
      itemForm.fixed_sale_price === '' ? '' : String(itemForm.fixed_sale_price),
    project: Number(projectId.value),
    nomenclature: Number(itemForm.nomenclature),
  }
}

async function handleSubmitItem() {
  itemError.value = ''

  try {
    const payload = normalizeItemPayload()

    if (!payload.nomenclature && payload.nomenclature !== 0) {
      itemError.value = 'Выберите товар'
      return
    }

    if (!payload.quantity) {
      itemError.value = 'Укажите количество'
      return
    }

    if (isEditItemMode.value) {
      await store.updateProjectItem(editingItemId.value, payload)
    } else {
      await store.createProjectItem(payload)
    }

    closeItemModal()
  } catch (error) {
    itemError.value =
      error?.response?.data?.detail || 'Не удалось сохранить позицию'
  }
}

async function handleDeleteItem(row) {
  const confirmed = window.confirm('Удалить позицию проекта?')
  if (!confirmed) return

  try {
    await store.deleteProjectItem(row.id)
  } catch (error) {
    alert(error?.response?.data?.detail || 'Не удалось удалить позицию')
  }
}

/* =========================
   ОБЩЕЕ
========================= */
function goBack() {
  router.push({ name: 'projects' })
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

onMounted(async () => {
  try {
    await store.initProjectDetails(projectId.value)
  } catch (error) {
    console.error('Ошибка загрузки проекта', error)
  }
})

onUnmounted(() => {
  store.clearCurrentProject()
})
</script>

<style scoped>
.project-details-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 8px 0 0;
  font-size: 28px;
}

.back-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font: inherit;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.card h2 {
  margin: 0;
  font-size: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #6b7280;
  font-size: 13px;
}

.value {
  font-size: 15px;
  font-weight: 500;
}

.economy-table {
  width: 100%;
  border-collapse: collapse;
}

.economy-table td {
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.economy-table td:last-child {
  text-align: right;
  font-weight: 600;
}

.access-row {
  font-size: 15px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-state,
.empty-state {
  padding: 20px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  background: #fff;
}

.primary-btn,
.secondary-btn,
.danger-btn,
.icon-btn {
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
  padding: 10px 14px;
}

.secondary-btn {
  background: #e5e7eb;
  color: #111827;
  padding: 8px 12px;
}

.danger-btn {
  background: #dc2626;
  color: #fff;
  padding: 8px 12px;
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
  max-width: 860px;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h2 {
  margin: 0;
}

.project-form {
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

.form-error {
  color: #dc2626;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .project-details-page {
    padding: 16px;
  }

  .info-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>