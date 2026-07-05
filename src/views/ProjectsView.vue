<template>
  <div class="projects-page">
    <div class="page-header">
      <h1>Проекты</h1>

      <button class="primary-btn" @click="openCreateModal">
        + Создать проект
      </button>
    </div>

    <!-- Теги/плитки статусов -->
    <div class="status-tiles">
      <button
        v-for="tile in store.statusTiles"
        :key="tile.id"
        class="status-tile"
        :class="{ active: store.activeStatusId === tile.id }"
        @click="store.setActiveStatus(tile.id)"
      >
        <span class="status-name">{{ tile.name }}</span>
        <span class="status-count">{{ tile.count }}</span>
      </button>
    </div>

    <!-- Таблица проектов -->
    <Table
      :columns="columns"
      :rows="tableRows"
      :loading="store.loading || financeLoading"
      row-key="id"
    >
      <template #cell-name="{ row }">
        <button class="link-cell" @click="goToProject(row.id)">
          {{ row.name || '—' }}
        </button>
      </template>

      <template #cell-client_name="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell-manager_name="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell-geography="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell-amount="{ value }">
        {{ formatMoney(value) }}
      </template>

      <template #cell-margin_value="{ value }">
        {{ value === '—' ? '—' : `${formatPercent(value)}%` }}
      </template>

      <template #cell-paid="{ value }">
        {{ formatMoney(value) }}
      </template>

      <template #cell-deadline="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-status_name="{ value }">
        <span class="status-badge">
          {{ value || '—' }}
        </span>
      </template>
    </Table>

    <!-- Модалка создания проекта -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Создать проект</h2>
          <button class="icon-btn" @click="closeModal">✕</button>
        </div>

        <form class="project-form" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Название проекта *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                placeholder="Введите название проекта"
              />
            </div>

            <div class="form-group">
              <label for="geography">География</label>
              <input
                id="geography"
                v-model="form.geography"
                type="text"
                placeholder="Например: Казахстан"
              />
            </div>

            <div class="form-group">
              <label for="client">Клиент *</label>
              <select id="client" v-model="form.client" required>
                <option disabled value="">Выберите клиента</option>
                <option
                  v-for="client in store.clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </option>
              </select>

              <button
                type="button"
                class="inline-action-btn"
                @click="openClientModal"
              >
                + Создать клиента
              </button>
            </div>

            <div class="form-group">
              <label for="tech_manager">Тех. менеджер *</label>
              <select id="tech_manager" v-model="form.tech_manager" required>
                <option disabled value="">Выберите менеджера</option>
                <option
                  v-for="manager in store.managers"
                  :key="manager.id"
                  :value="manager.id"
                >
                  {{ manager.full_name }}
                </option>
              </select>

              <button
                type="button"
                class="inline-action-btn"
                @click="openManagerModal"
              >
                + Создать тех. менеджера
              </button>
            </div>

            <div class="form-group">
              <label for="status">Статус *</label>
              <select id="status" v-model="form.status" required>
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

          <div v-if="errorMessage" class="form-error">
            {{ errorMessage }}
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">
              Отмена
            </button>

            <button type="submit" class="primary-btn" :disabled="store.saving">
              {{ store.saving ? 'Сохранение...' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модалка создания клиента -->
    <div
      v-if="showClientModal"
      class="modal-overlay"
      @click.self="closeClientModal"
    >
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Создать клиента</h2>
          <button class="icon-btn" @click="closeClientModal">✕</button>
        </div>

        <form class="project-form" @submit.prevent="handleCreateClient">
          <div class="form-group">
            <label for="client-name">Название *</label>
            <input
              id="client-name"
              v-model="clientForm.name"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="client-contacts">Контакты</label>
            <input
              id="client-contacts"
              v-model="clientForm.contacts"
              type="text"
            />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="secondary-btn"
              @click="closeClientModal"
            >
              Отмена
            </button>
            <button type="submit" class="primary-btn">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модалка создания менеджера -->
    <div
      v-if="showManagerModal"
      class="modal-overlay"
      @click.self="closeManagerModal"
    >
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>Создать тех. менеджера</h2>
          <button class="icon-btn" @click="closeManagerModal">✕</button>
        </div>

        <form class="project-form" @submit.prevent="handleCreateManager">
          <div class="form-group">
            <label for="manager-name">ФИО *</label>
            <input
              id="manager-name"
              v-model="managerForm.full_name"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="manager-contacts">Контакты</label>
            <input
              id="manager-contacts"
              v-model="managerForm.contacts"
              type="text"
            />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="secondary-btn"
              @click="closeManagerModal"
            >
              Отмена
            </button>
            <button type="submit" class="primary-btn">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Table from '@/components/Table.vue'
import { useProjectsStore } from '@/stores/projects'
import { useFinanceStore } from '@/stores/finance.store'

const router = useRouter()
const store = useProjectsStore()
const financeStore = useFinanceStore()

const columns = [
  { key: 'name', label: 'Проект' },
  { key: 'client_name', label: 'Клиент' },
  { key: 'manager_name', label: 'Менеджер' },
  { key: 'geography', label: 'Страна' },
  { key: 'amount', label: 'Сумма' },
  { key: 'margin_value', label: 'Маржа' },
  { key: 'paid', label: 'Оплачено' },
  { key: 'deadline', label: 'Срок' },
  { key: 'status_name', label: 'Статус' },
]

const tableRows = ref([])
const financeLoading = ref(false)

const showModal = ref(false)
const showClientModal = ref(false)
const showManagerModal = ref(false)
const errorMessage = ref('')

const getInitialForm = () => ({
  name: '',
  geography: '',
  client: '',
  tech_manager: '',
  status: '',
})

const form = reactive(getInitialForm())

const clientForm = reactive({
  name: '',
  contacts: '',
})

const managerForm = reactive({
  full_name: '',
  contacts: '',
})

function resetForm() {
  Object.assign(form, getInitialForm())
  errorMessage.value = ''
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function openClientModal() {
  clientForm.name = ''
  clientForm.contacts = ''
  showClientModal.value = true
}

function closeClientModal() {
  showClientModal.value = false
}

function openManagerModal() {
  managerForm.full_name = ''
  managerForm.contacts = ''
  showManagerModal.value = true
}

function closeManagerModal() {
  showManagerModal.value = false
}

async function handleSubmit() {
  errorMessage.value = ''

  try {
    const payload = {
      name: form.name.trim(),
      geography: form.geography.trim(),
      client: Number(form.client),
      tech_manager: Number(form.tech_manager),
      status: Number(form.status),
    }

    if (!payload.name) {
      errorMessage.value = 'Введите название проекта'
      return
    }

    await store.createProject(payload)
    closeModal()

    await store.initProjectsPage()
    await buildTableRows()
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.detail || 'Не удалось создать проект'
  }
}

async function handleCreateClient() {
  try {
    const created = await store.createClient({
      type: 'CLIENT',
      name: clientForm.name.trim(),
      contacts: clientForm.contacts.trim(),
    })

    form.client = created.id
    closeClientModal()
  } catch (error) {
    alert(error?.response?.data?.detail || 'Не удалось создать клиента')
  }
}

async function handleCreateManager() {
  try {
    const created = await store.createTechnicalManager({
      full_name: managerForm.full_name.trim(),
      contacts: managerForm.contacts.trim(),
    })

    form.tech_manager = created.id
    closeManagerModal()
  } catch (error) {
    alert(error?.response?.data?.detail || 'Не удалось создать менеджера')
  }
}

function goToProject(id) {
  router.push({ name: 'project-details', params: { id } })
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return num.toFixed(2)
}

function formatDate(value) {
  if (!value || value === '—') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

async function buildTableRows() {
  const sourceRows = Array.isArray(store.projectTableRows)
    ? store.projectTableRows
    : []

  financeLoading.value = true

  try {
    const rows = await Promise.all(
      sourceRows.map(async (row) => {
        try {
          const report = await financeStore.fetchProjectReport(row.id)

          return {
            ...row,
            amount: report?.planned?.revenue ?? '—',
            margin_value: report?.planned?.margin ?? '—',
            paid: report?.fact?.client_received ?? '—',
          }
        } catch (error) {
          console.error(`Ошибка загрузки финансов проекта ${row.id}`, error)

          return {
            ...row,
            amount: '—',
            margin_value: '—',
            paid: '—',
          }
        }
      })
    )

    tableRows.value = rows
  } finally {
    financeLoading.value = false
    financeStore.clearProjectReport()
  }
}

onMounted(async () => {
  try {
    await store.initProjectsPage()
    await buildTableRows()
  } catch (error) {
    console.error('Ошибка загрузки проектов', error)
  }
})
</script>





<style scoped>
.projects-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.status-tiles {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.status-tile {
  min-width: 140px;
  padding: 14px 16px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: 0.2s ease;
}

.status-tile:hover {
  border-color: #2563eb;
}

.status-tile.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.status-name {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.status-count {
  color: #6b7280;
  font-size: 14px;
}

.link-cell {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-align: left;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 13px;
}

.primary-btn,
.secondary-btn,
.icon-btn,
.inline-action-btn {
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
  padding: 10px 14px;
}

.inline-action-btn {
  margin-top: 8px;
  align-self: flex-start;
  background: transparent;
  color: #2563eb;
  padding: 0;
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

.modal-small {
  max-width: 520px;
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

@media (max-width: 768px) {
  .projects-page {
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