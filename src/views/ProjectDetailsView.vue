```vue
<template>
  <div class="project-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="page-header__left">
        <button class="btn btn--ghost" @click="goBack">
          ← Назад к проектам
        </button>

        <div>
          <h1 class="page-title">{{ projectInfo?.name || 'Проект' }}</h1>
          <div class="page-subtitle">
            <span
              v-if="projectInfo"
              class="status-badge"
              :class="statusBadgeClass(projectInfo.status)"
            >
              {{ projectInfo.status_name }}
            </span>
          </div>
        </div>
      </div>

      <div class="page-header__right">
        <button class="btn btn--primary" @click="openEditProject">
          Редактировать проект
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Загрузка проекта...</span>
    </div>

    <template v-else-if="projectInfo">
      <div class="project-layout">
        <!-- ЛЕВАЯ КОЛОНКА -->
        <div class="project-main">
          <!-- ИНФОРМАЦИЯ -->
          <section class="card">
            <div class="card__header">
              <h2 class="card__title">Информация о проекте</h2>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">Статус</span>
                <span class="info-item__value">
                  <span
                    class="status-badge"
                    :class="statusBadgeClass(projectInfo.status)"
                  >
                    {{ projectInfo.status_name }}
                  </span>
                </span>
              </div>

              <div class="info-item">
                <span class="info-item__label">Клиент</span>
                <span class="info-item__value">{{ projectInfo.client_name }}</span>
              </div>

              <div class="info-item">
                <span class="info-item__label">Менеджер</span>
                <span class="info-item__value">{{ projectInfo.manager_name }}</span>
              </div>

              <div class="info-item">
                <span class="info-item__label">География</span>
                <span class="info-item__value">{{ projectInfo.geography || '—' }}</span>
              </div>

              <div class="info-item">
                <span class="info-item__label">Создан</span>
                <span class="info-item__value">{{ formatDate(projectInfo.created_at) }}</span>
              </div>
            </div>
          </section>

          <!-- ПОЗИЦИИ -->
          <section class="card">
            <div class="card__header">
              <div>
                <h2 class="card__title">Позиции проекта</h2>
                <p class="card__subtitle">Товары, количество и сумма продаж</p>
              </div>

              <button class="btn btn--primary" @click="openCreateItem">
                + Добавить позицию
              </button>
            </div>

            <div v-if="itemsRows.length" class="table-wrap">
              <table class="project-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Кол-во</th>
                    <th>Себестоимость</th>
                    <th>Цена продажи</th>
                    <th>Сумма</th>
                    <th class="ta-right">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="item in itemsRows" :key="item.id">
                    <td class="td-name">{{ item.nomenclature_name }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatMoney(item.fixed_cost_price) }}</td>
                    <td>{{ formatMoney(item.fixed_sale_price) }}</td>
                    <td class="td-amount">{{ formatMoney(item.total_amount) }}</td>
                    <td class="ta-right">
                      <div class="table-actions">
                        <button class="btn btn--sm btn--ghost" @click="openEditItem(item)">
                          Редактировать
                        </button>
                        <button
                          class="btn btn--sm btn--danger"
                          @click="deleteItem(item.id)"
                          :disabled="store.deletingProjectItemId === item.id"
                        >
                          {{ store.deletingProjectItemId === item.id ? 'Удаление...' : 'Удалить' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-state">
              <div class="empty-state__title">Позиции ещё не добавлены</div>
              <div class="empty-state__text">
                Создайте первую позицию для этого проекта
              </div>
            </div>
          </section>
        </div>

        <!-- ПРАВАЯ КОЛОНКА -->
        <aside class="project-sidebar">
          <!-- ФИНАНСОВЫЕ KPI -->
          <section class="card">
            <div class="card__header">
              <h2 class="card__title">Финансы</h2>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-card__label">Плановая выручка</div>
                <div class="kpi-card__value">{{ formatMoney(planned.revenue) }}</div>
              </div>

              <div class="kpi-card">
                <div class="kpi-card__label">Плановая валовая прибыль</div>
                <div class="kpi-card__value">{{ formatMoney(planned.gross_profit) }}</div>
              </div>

              <div class="kpi-card">
                <div class="kpi-card__label">Маржа</div>
                <div class="kpi-card__value">{{ formatPercent(planned.margin) }}</div>
              </div>

              <div class="kpi-card kpi-card--accent">
                <div class="kpi-card__label">Чистая прибыль</div>
                <div class="kpi-card__value">{{ formatMoney(netProfit) }}</div>
              </div>
            </div>

            <div class="finance-blocks">
              <div class="finance-block">
                <h3>План</h3>
                <div class="finance-row">
                  <span>Выручка</span>
                  <strong>{{ formatMoney(planned.revenue) }}</strong>
                </div>
                <div class="finance-row">
                  <span>COGS</span>
                  <strong>{{ formatMoney(planned.cogs) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Валовая прибыль</span>
                  <strong>{{ formatMoney(planned.gross_profit) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Маржа</span>
                  <strong>{{ formatPercent(planned.margin) }}</strong>
                </div>
              </div>

              <div class="finance-block">
                <h3>Факт</h3>
                <div class="finance-row">
                  <span>Клиент оплатил</span>
                  <strong>{{ formatMoney(fact.client_received) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Фабрики оплачены</span>
                  <strong>{{ formatMoney(fact.factory_paid) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Расходы проекта</span>
                  <strong>{{ formatMoney(fact.project_expenses) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Операционные расходы</span>
                  <strong>{{ formatMoney(fact.operation_expenses) }}</strong>
                </div>
              </div>

              <div class="finance-block">
                <h3>Cashflow</h3>
                <div class="finance-row">
                  <span>Дебиторка</span>
                  <strong>{{ formatMoney(cashflow.accounts_receivable) }}</strong>
                </div>
                <div class="finance-row">
                  <span>Кредиторка</span>
                  <strong>{{ formatMoney(cashflow.accounts_payable) }}</strong>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <!-- MODAL ПРОЕКТА -->
    <div v-if="showProjectModal" class="modal" @click.self="closeProjectModal">
      <div class="modal__card modal__card--md">
        <div class="modal__header">
          <h3>Редактирование проекта</h3>
          <button class="icon-btn" @click="closeProjectModal">✕</button>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label>Название проекта</label>
            <input v-model="projectForm.name" placeholder="Название проекта" />
          </div>

          <div class="form-field">
            <label>География</label>
            <input v-model="projectForm.geography" placeholder="Например: Казахстан, РФ, EU" />
          </div>

          <div class="form-field">
            <label>Клиент</label>
            <select v-model="projectForm.client">
              <option disabled value="">Выберите клиента</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label>Менеджер</label>
            <select v-model="projectForm.tech_manager">
              <option disabled value="">Выберите менеджера</option>
              <option v-for="m in managers" :key="m.id" :value="m.id">
                {{ m.full_name }}
              </option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <label>Статус</label>
            <select v-model="projectForm.status">
              <option disabled value="">Выберите статус</option>
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeProjectModal">Отмена</button>
          <button class="btn btn--primary" :disabled="store.saving" @click="saveProject">
            {{ store.saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ITEM -->
    <div v-if="showItemModal" class="modal" @click.self="closeItemModal">
      <div class="modal__card modal__card--md">
        <div class="modal__header">
          <h3>{{ editingItemId ? 'Редактирование позиции' : 'Новая позиция' }}</h3>
          <button class="icon-btn" @click="closeItemModal">✕</button>
        </div>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label>Товар / номенклатура</label>
            <select v-model="itemForm.nomenclature">
              <option disabled value="">Выберите товар</option>
              <option v-for="n in nomenclatures" :key="n.id" :value="n.id">
                {{ n.name }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label>Количество</label>
            <input v-model="itemForm.quantity" type="number" placeholder="0" />
          </div>

          <div class="form-field">
            <label>Себестоимость</label>
            <input v-model="itemForm.fixed_cost_price" type="number" placeholder="0" />
          </div>

          <div class="form-field">
            <label>Цена продажи</label>
            <input v-model="itemForm.fixed_sale_price" type="number" placeholder="0" />
          </div>
        </div>

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeItemModal">Отмена</button>
          <button class="btn btn--primary" :disabled="store.saving" @click="saveItem">
            {{ store.saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'

const store = useProjectsStore()
const route = useRoute()
const router = useRouter()

const projectId = Number(route.params.id)

const loading = ref(false)

const project = computed(() => store.currentProject)
const projectInfo = computed(() => store.currentProjectInfo)
const finance = computed(() => store.currentProjectFinance)
const itemsRows = computed(() => store.currentProjectItemsRows)

const planned = computed(() => finance.value?.planned || {})
const fact = computed(() => finance.value?.fact || {})
const cashflow = computed(() => finance.value?.cashflow || {})
const netProfit = computed(() => finance.value?.net_profit ?? 0)

const clients = computed(() => store.clients)
const managers = computed(() => store.managers)
const statuses = computed(() => store.statuses)
const nomenclatures = computed(() => store.nomenclatures)

onMounted(async () => {
  loading.value = true
  await store.initProjectDetails(projectId)
  loading.value = false
})

onBeforeUnmount(() => {
  store.clearCurrentProject()
})

function goBack() {
  router.push('/projects')
}

/* ===================== */
/* PROJECT EDIT */
/* ===================== */
const showProjectModal = ref(false)

const projectForm = reactive({
  name: '',
  geography: '',
  client: '',
  tech_manager: '',
  status: '',
})

function openEditProject() {
  if (!project.value) return

  Object.assign(projectForm, {
    name: project.value.name ?? '',
    geography: project.value.geography ?? '',
    client: project.value.client ?? '',
    tech_manager: project.value.tech_manager ?? '',
    status: project.value.status ?? '',
  })

  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
}

async function saveProject() {
  await store.updateProject(projectId, {
    name: projectForm.name,
    geography: projectForm.geography,
    client: Number(projectForm.client),
    tech_manager: Number(projectForm.tech_manager),
    status: Number(projectForm.status),
  })

  showProjectModal.value = false
}

/* ===================== */
/* ITEMS */
/* ===================== */
const showItemModal = ref(false)
const editingItemId = ref(null)

const itemForm = reactive({
  nomenclature: '',
  quantity: '',
  fixed_cost_price: '',
  fixed_sale_price: '',
  project: projectId,
})

function openCreateItem() {
  editingItemId.value = null

  Object.assign(itemForm, {
    nomenclature: '',
    quantity: '',
    fixed_cost_price: '',
    fixed_sale_price: '',
    project: projectId,
  })

  showItemModal.value = true
}

function openEditItem(item) {
  editingItemId.value = item.id

  Object.assign(itemForm, {
    nomenclature: item.nomenclature,
    quantity: item.quantity,
    fixed_cost_price: item.fixed_cost_price,
    fixed_sale_price: item.fixed_sale_price,
    project: projectId,
  })

  showItemModal.value = true
}

function closeItemModal() {
  showItemModal.value = false
}

async function saveItem() {
  const payload = {
    nomenclature: Number(itemForm.nomenclature),
    quantity: Number(itemForm.quantity),
    fixed_cost_price: Number(itemForm.fixed_cost_price),
    fixed_sale_price: Number(itemForm.fixed_sale_price),
    project: projectId,
  }

  if (editingItemId.value) {
    await store.updateProjectItem(editingItemId.value, payload)
  } else {
    await store.createProjectItem(payload)
  }

  showItemModal.value = false
}

async function deleteItem(id) {
  await store.deleteProjectItem(id)
}

/* ===================== */
/* UI HELPERS */
/* ===================== */
function formatMoney(value) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(number)
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${value}%`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU').format(date)
}

/**
 * Можно потом завязать на реальные id статусов.
 * Пока делаем fallback по названию статуса / id.
 */
function statusBadgeClass(statusId) {
  const status = statuses.value.find(s => s.id === statusId)
  const name = (status?.name || '').toLowerCase()

  if (
    name.includes('работ') ||
    name.includes('актив') ||
    name.includes('process') ||
    name.includes('progress')
  ) {
    return 'status-badge--blue'
  }

  if (
    name.includes('заверш') ||
    name.includes('done') ||
    name.includes('success') ||
    name.includes('closed')
  ) {
    return 'status-badge--green'
  }

  if (
    name.includes('нов') ||
    name.includes('draft') ||
    name.includes('подготов')
  ) {
    return 'status-badge--gray'
  }

  if (
    name.includes('просроч') ||
    name.includes('cancel') ||
    name.includes('отмен')
  ) {
    return 'status-badge--red'
  }

  return 'status-badge--gray'
}
</script>

<style scoped>
:root {
  color-scheme: dark;
}

.project-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 30%),
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.06), transparent 30%),
    #0b1120;
  color: #e5e7eb;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ===== HEADER ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 800;
  color: #f8fafc;
}

.page-subtitle {
  margin-top: 8px;
}

/* ===== LAYOUT ===== */
.project-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  gap: 20px;
  align-items: start;
}

.project-main,
.project-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== CARD ===== */
.card {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(11, 18, 32, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.card__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

.card__subtitle {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

/* ===== INFO GRID ===== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
}

.info-item__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #94a3b8;
}

.info-item__value {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  word-break: break-word;
}

/* ===== STATUS ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
}

.status-badge--blue {
  color: #bfdbfe;
  background: rgba(37, 99, 235, 0.18);
  border-color: rgba(59, 130, 246, 0.35);
}

.status-badge--green {
  color: #bbf7d0;
  background: rgba(16, 185, 129, 0.16);
  border-color: rgba(16, 185, 129, 0.35);
}

.status-badge--gray {
  color: #e2e8f0;
  background: rgba(100, 116, 139, 0.18);
  border-color: rgba(148, 163, 184, 0.24);
}

.status-badge--red {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.32);
}

/* ===== KPI ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.kpi-card {
  padding: 16px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(11, 18, 32, 0.85));
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.kpi-card--accent {
  border-color: rgba(59, 130, 246, 0.4);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
}

.kpi-card__label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 10px;
  line-height: 1.4;
}

.kpi-card__value {
  font-size: 24px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

/* ===== FINANCE ===== */
.finance-blocks {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.finance-block {
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
}

.finance-block h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #f8fafc;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  font-size: 14px;
}

.finance-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.finance-row span {
  color: #94a3b8;
}

.finance-row strong {
  color: #f8fafc;
  font-weight: 700;
  text-align: right;
}

/* ===== TABLE ===== */
.table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
  background: rgba(8, 15, 28, 0.7);
}

.project-table thead th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  white-space: nowrap;
}

.project-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  color: #e2e8f0;
  font-size: 14px;
  vertical-align: middle;
}

.project-table tbody tr:last-child td {
  border-bottom: none;
}

.project-table tbody tr:hover td {
  background: rgba(15, 23, 42, 0.75);
}

.td-name {
  font-weight: 600;
  color: #f8fafc;
}

.td-amount {
  font-weight: 700;
  color: #f8fafc;
}

.ta-right {
  text-align: right;
}

.table-actions {
  display: inline-flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* ===== BUTTONS ===== */
.btn {
  appearance: none;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.btn--primary {
  color: #eff6ff;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
}

.btn--primary:hover {
  background: linear-gradient(180deg, #4f8ff7, #2f6df0);
}

.btn--ghost {
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.btn--ghost:hover {
  background: rgba(30, 41, 59, 0.85);
}

.btn--danger {
  color: #fee2e2;
  background: rgba(127, 29, 29, 0.9);
  border: 1px solid rgba(248, 113, 113, 0.22);
}

.btn--danger:hover {
  background: rgba(153, 27, 27, 0.95);
}

.btn--sm {
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
}

/* ===== MODAL ===== */
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.modal__card {
  width: min(100%, 720px);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  padding: 24px;
}

.modal__card--md {
  max-width: 720px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.modal__header h3 {
  margin: 0;
  font-size: 22px;
  color: #f8fafc;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 14px;
}

.icon-btn:hover {
  background: rgba(30, 41, 59, 0.9);
}

/* ===== FORM ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

input,
select {
  width: 100%;
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(8, 15, 28, 0.85);
  color: #f8fafc;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

input::placeholder {
  color: #64748b;
}

input:focus,
select:focus {
  border-color: rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  background: rgba(15, 23, 42, 0.95);
}

/* ===== EMPTY / LOADING ===== */
.empty-state {
  padding: 36px 20px;
  text-align: center;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.35);
  border: 1px dashed rgba(148, 163, 184, 0.14);
}

.empty-state__title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}

.empty-state__text {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 14px;
}

.loading-state {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #cbd5e1;
  font-size: 15px;
}

.spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid rgba(148, 163, 184, 0.28);
  border-top-color: #60a5fa;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .project-layout {
    grid-template-columns: 1fr;
  }

  .project-sidebar {
    order: -1;
  }
}

@media (max-width: 900px) {
  .project-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__right {
    display: flex;
    justify-content: flex-start;
  }

  .info-grid,
  .form-grid,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px;
    border-radius: 18px;
  }

  .page-title {
    font-size: 24px;
  }

  .modal {
    padding: 12px;
  }

  .modal__card {
    padding: 18px;
    border-radius: 18px;
  }
}

@media (max-width: 640px) {
  .card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }

  .modal__actions {
    flex-direction: column-reverse;
  }

  .modal__actions .btn {
    width: 100%;
  }
}
</style>
```
