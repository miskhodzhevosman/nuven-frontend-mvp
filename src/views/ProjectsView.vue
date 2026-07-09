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
import { onMounted, reactive, ref, watch } from 'vue'
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

    // после создания просто заново грузим страницу проектов;
    // watcher ниже сам пересоберёт tableRows
    await store.initProjectsPage()
  } catch (error) {
    // Обновлённая обработка ошибок для fetch
    errorMessage.value = error?.message || 'Не удалось создать проект'
    console.error('❌ Create project error:', error)
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
    // Обновлённая обработка ошибок
    alert(error?.message || 'Не удалось создать клиента')
    console.error('❌ Create client error:', error)
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
    // Обновлённая обработка ошибок
    alert(error?.message || 'Не удалось создать менеджера')
    console.error('❌ Create manager error:', error)
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

/**
 * Собираем строки таблицы на основе УЖЕ отфильтрованного store.projectTableRows
 * и дозаполняем финансовые поля.
 */
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
            amount: report?.planned?.revenue ?? row.amount ?? '—',
            margin_value: report?.planned?.margin ?? row.margin_value ?? '—',
            paid: report?.fact?.client_received ?? row.paid ?? '—',
          }
        } catch (error) {
          console.error(`❌ Ошибка загрузки финансов проекта ${row.id}:`, error)

          return {
            ...row,
            amount: row.amount ?? '—',
            margin_value: row.margin_value ?? '—',
            paid: row.paid ?? '—',
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

/**
 * 1) Первичная загрузка страницы
 */
onMounted(async () => {
  try {
    await store.initProjectsPage()
  } catch (error) {
    console.error('❌ Ошибка загрузки проектов:', error)
  }
})

/**
 * 2) Самое важное:
 * каждый раз, когда меняется store.projectTableRows
 * (а он меняется и при initProjectsPage, и при переключении плитки),
 * мы заново собираем tableRows.
 */
watch(
  () => store.projectTableRows,
  async () => {
    await buildTableRows()
  },
  { immediate: true }
)
</script>

<style scoped>
.projects-page {
  padding: 24px;
  background: #0E0F12;
  color: #D0D2D5;
  min-height: 100vh;
}

/* HEADER */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: #16181C;
  border-radius: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #C9A86A;
}

/* STATUS TILES */
.status-tiles {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.status-tile {
  min-width: 140px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #2A2D33;
  background: #16181C;
  color: #D0D2D5;
  cursor: pointer;
  transition: 0.15s ease;
}

.status-tile:hover {
  border-color: #C9A86A;
}

.status-tile.active {
  border-color: #C9A86A;
  background: #0E0F12;
}

.status-name {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #D0D2D5;
}

.status-count {
  color: #9AA0A6;
  font-size: 14px;
}

/* TABLE LINK */
.link-cell {
  border: none;
  background: transparent;
  color: #C9A86A;
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-align: left;
}

.link-cell:hover {
  color: #D0D2D5;
}

/* STATUS BADGE */
.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
  font-size: 13px;
  color: #D0D2D5;
}

/* BUTTONS */
.primary-btn,
.secondary-btn,
.icon-btn,
.inline-action-btn {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s ease;
}

.primary-btn {
  background: #C9A86A;
  color: #0E0F12;
  padding: 10px 14px;
}

.primary-btn:hover {
  filter: brightness(1.1);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  background: #2A2D33;
  color: #D0D2D5;
  padding: 10px 14px;
}

.secondary-btn:hover {
  background: #343842;
}

.inline-action-btn {
  margin-top: 8px;
  background: transparent;
  color: #C9A86A;
  padding: 0;
}

.inline-action-btn:hover {
  color: #D0D2D5;
}

.icon-btn {
  background: transparent;
  font-size: 18px;
  padding: 4px 8px;
  color: #D0D2D5;
}

.icon-btn:hover {
  color: #C9A86A;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 860px;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 14px;
  padding: 20px;
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
  color: #C9A86A;
}

/* FORM */
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
  color: #D0D2D5;
}

.form-group input,
.form-group select {
  min-height: 42px;
  border: 1px solid #2A2D33;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  background: #0E0F12;
  color: #D0D2D5;
  outline: none;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #C9A86A;
}

/* ERROR */
.form-error {
  color: #C96A6A;
  font-size: 14px;
  padding: 12px;
  background: rgba(201, 106, 106, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(201, 106, 106, 0.3);
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

/* RESPONSIVE */
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

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>