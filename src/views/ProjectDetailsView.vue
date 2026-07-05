<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getOperationTypes,
  createOperationType
} from '@/services/finance.service'

const store = useProjectsStore()
const route = useRoute()
const router = useRouter()

const projectId = Number(route.params.id)

/* ===================== */
/* LOADING */
/* ===================== */

const loading = ref(false)

/* ===================== */
/* STORE DATA */
/* ===================== */

const project = computed(() => store.currentProject)
const projectInfo = computed(() => store.currentProjectInfo)
const finance = computed(() => store.currentProjectFinance)
const itemsRows = computed(() => store.currentProjectItemsRows)
const clients = computed(() => store.clients)
const managers = computed(() => store.managers)
const statuses = computed(() => store.statuses)

/* безопасные алиасы (ВАЖНО) */
const planned = computed(() => finance.value?.planned || {})
const fact = computed(() => finance.value?.fact || {})
const cashflow = computed(() => finance.value?.cashflow || {})

/* ===================== */
/* EXPENSES STATE */
/* ===================== */

const transactions = ref([])
const operationTypes = ref([])

const projectExpenses = computed(() => transactions.value)

/* ===================== */
/* INIT */
/* ===================== */

onMounted(async () => {
  loading.value = true

  await store.initProjectDetails(projectId)

  await loadOperationTypes()
  await loadExpenses()

  loading.value = false
})

onBeforeUnmount(() => {
  store.clearCurrentProject()
})

/* ===================== */
/* FINANCE TYPES */
/* ===================== */

async function loadOperationTypes() {
  operationTypes.value = await getOperationTypes()
}

function getTypeId(code) {
  return operationTypes.value.find(t => t.code === code)?.id
}

/* ===================== */
/* EXPENSES */
/* ===================== */

async function loadExpenses() {
  const all = await getTransactions()

  const typeId = getTypeId('project_expense')

  transactions.value = all.filter(t =>
    t.project === projectId &&
    t.finance_operation_type === typeId
  )
}

/* ===================== */
/* MODAL EXPENSE */
/* ===================== */

const showExpenseModal = ref(false)

const showItemModal = ref(false)

const itemForm = reactive({
  nomenclature: null,
  quantity: 1,
  fixed_cost_price: 0,
  fixed_sale_price: 0,
})

const expenseForm = reactive({
  name: '',
  amount: '',
  date: ''
})

function openExpenseModal() {
  showExpenseModal.value = true
}

function closeExpenseModal() {
  showExpenseModal.value = false
}

/* ===================== */
/* SAVE EXPENSE (FIXED) */
/* ===================== */

async function saveExpense() {
  let typeId = getTypeId('project_expense')

  if (!typeId) {
    const created = await createOperationType({
      name: 'Project expense',
      code: 'project_expense'
    })

    operationTypes.value.push(created)
    typeId = created.id
  }

  await createTransaction({
    name: expenseForm.name,
    amount: Number(expenseForm.amount),
    date: expenseForm.date,
    project: projectId,
    counterparty: null,
    finance_operation_type: typeId
  })

  closeExpenseModal()
  await loadExpenses()
}

function openCreateItem() {
  itemForm.nomenclature = null
  itemForm.quantity = 1
  itemForm.fixed_cost_price = 0
  itemForm.fixed_sale_price = 0

  showItemModal.value = true
}

async function saveItem() {
  await store.createProjectItem({
    project: projectId,
    ...itemForm
  })

  showItemModal.value = false
}

/* ===================== */
/* DELETE EXPENSE */
/* ===================== */

async function deleteExpense(id) {
  await deleteTransaction(id)
  await loadExpenses()
}

/* ===================== */
/* PROJECT EDIT MODAL */
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
/* STATUS BADGE (ВОССТАНОВЛЕНО) */
/* ===================== */

function statusBadgeClass(statusId) {
  const status = store.statuses?.find(s => s.id === statusId)
  const name = (status?.name || '').toLowerCase()

  if (name.includes('работ') || name.includes('process')) {
    return 'status-badge--blue'
  }

  if (name.includes('заверш') || name.includes('done')) {
    return 'status-badge--green'
  }

  if (name.includes('нов') || name.includes('draft')) {
    return 'status-badge--gray'
  }

  if (name.includes('отмен') || name.includes('cancel')) {
    return 'status-badge--red'
  }

  return 'status-badge--gray'
}

/* ===================== */
/* HELPERS */
/* ===================== */

function goBack() {
  router.push('/projects')
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>

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

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Загрузка проекта...</span>
    </div>

    <template v-else-if="projectInfo">
      <div class="project-layout">

        <!-- LEFT -->
        <div class="project-main">

          <!-- INFO -->
          <section class="card">
            <div class="card__header">
              <h2 class="card__title">Информация о проекте</h2>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">Статус</span>
                <span class="info-item__value">
                  <span class="status-badge" :class="statusBadgeClass(projectInfo.status)">
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
          

          <!-- ITEMS -->
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
                          Удалить
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

          <!-- 💥 PROJECT EXPENSES -->
          <section class="card">
            <div class="card__header">
              <div>
                <h2 class="card__title">Проектные расходы</h2>
                <p class="card__subtitle">Расходы, привязанные к проекту</p>
              </div>

              <button class="btn btn--primary" @click="openExpenseModal">
                + Добавить расход
              </button>
            </div>

            <div v-if="projectExpenses?.length" class="table-wrap">
              <table class="project-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th class="ta-right">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="e in projectExpenses" :key="e.id">
                    <td>{{ e.name }}</td>
                    <td>{{ formatDate(e.date) }}</td>
                    <td>{{ formatMoney(e.amount) }}</td>
                    <td class="ta-right">
                      <button class="btn btn--sm btn--danger" @click="deleteExpense(e.id)">
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-state">
              <div class="empty-state__title">Нет расходов</div>
              <div class="empty-state__text">
                Добавьте первый проектный расход
              </div>
            </div>
          </section>

        </div>

        <!-- RIGHT -->
<aside class="project-sidebar">
  <section class="card">
    <h2 class="card__title">Финансы</h2>

    <div class="finance-blocks">

      <!-- PLAN -->
      <div class="finance-block">
        <h3>План</h3>

        <div class="finance-row">
          <span>Выручка</span>
          <strong>{{ formatMoney(planned?.revenue ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>COGS</span>
          <strong>{{ formatMoney(planned?.cogs ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Валовая прибыль</span>
          <strong>{{ formatMoney(planned?.gross_profit ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Маржа</span>
          <strong>{{ planned?.margin ?? 0 }}%</strong>
        </div>
      </div>

      <!-- FACT -->
      <div class="finance-block">
        <h3>Факт</h3>

        <div class="finance-row">
          <span>Оплата от клиента</span>
          <strong>{{ formatMoney(fact?.client_received ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Оплаты фабрикам</span>
          <strong>{{ formatMoney(fact?.factory_paid ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Проектные расходы</span>
          <strong>{{ formatMoney(fact?.project_expenses ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Операционные расходы</span>
          <strong>{{ formatMoney(fact?.operation_expenses ?? 0) }}</strong>
        </div>
      </div>

      <!-- CASHFLOW -->
      <div class="finance-block">
        <h3>Cashflow</h3>

        <div class="finance-row">
          <span>Дебиторка</span>
          <strong>{{ formatMoney(cashflow?.accounts_receivable ?? 0) }}</strong>
        </div>

        <div class="finance-row">
          <span>Кредиторка</span>
          <strong>{{ formatMoney(cashflow?.accounts_payable ?? 0) }}</strong>
        </div>
      </div>

    </div>
  </section>
</aside>

      </div>
    </template>

    <!-- MODAL EXPENSE -->
    <div v-if="showExpenseModal" class="modal" @click.self="closeExpenseModal">
      <div class="modal__card modal__card--md">
        <div class="modal__header">
          <h3>Новый проектный расход</h3>
          <button class="icon-btn" @click="closeExpenseModal">✕</button>
        </div>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label>Название</label>
            <input v-model="expenseForm.name" placeholder="Например: логистика" />
          </div>

          <div class="form-field">
            <label>Сумма</label>
            <input v-model="expenseForm.amount" type="number" />
          </div>

          <div class="form-field">
            <label>Дата</label>
            <input v-model="expenseForm.date" type="date" />
          </div>
        </div>

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeExpenseModal">
            Отмена
          </button>
          <button class="btn btn--primary" @click="saveExpense">
            Сохранить
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL PROJECT -->
    <div v-if="showProjectModal" class="modal" @click.self="closeProjectModal">
      <div class="modal__card modal__card--md">
        <div class="modal__header">
          <h3>Редактирование проекта</h3>
          <button class="icon-btn" @click="closeProjectModal">✕</button>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label>Название</label>
            <input v-model="projectForm.name" />
          </div>

          <div class="form-field">
            <label>География</label>
            <input v-model="projectForm.geography" />
          </div>

          <div class="form-field">
            <label>Клиент</label>
            <select v-model="projectForm.client">
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label>Менеджер</label>
            <select v-model="projectForm.tech_manager">
              <option v-for="m in managers" :key="m.id" :value="m.id">
                {{ m.full_name }}
              </option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <label>Статус</label>
            <select v-model="projectForm.status">
              <option v-for="s in statuses" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeProjectModal">Отмена</button>
          <button class="btn btn--primary" @click="saveProject">
            Сохранить
          </button>
        </div>
      </div>
    </div>

    <div v-if="showItemModal" class="modal" @click.self="showItemModal = false">
  <div class="modal__card modal__card--md">
    <div class="modal__header">
      <h3>Новая позиция проекта</h3>
      <button class="icon-btn" @click="showItemModal = false">✕</button>
    </div>

    <div class="form-grid">
      <div class="form-field form-field--full">
        <label>Номенклатура</label>
        <select v-model="itemForm.nomenclature">
          <option v-for="n in store.nomenclatures" :key="n.id" :value="n.id">
            {{ n.name }}
          </option>
        </select>
      </div>

      <div class="form-field">
        <label>Количество</label>
        <input type="number" v-model="itemForm.quantity" />
      </div>

      <div class="form-field">
        <label>Себестоимость</label>
        <input type="number" v-model="itemForm.fixed_cost_price" />
      </div>

      <div class="form-field">
        <label>Цена продажи</label>
        <input type="number" v-model="itemForm.fixed_sale_price" />
      </div>
    </div>

    <div class="modal__actions">
      <button class="btn btn--ghost" @click="showItemModal = false">
        Отмена
      </button>
      <button class="btn btn--primary" @click="saveItem">
        Сохранить
      </button>
    </div>
  </div>
</div>
  </div>
</template>
<style scoped>
.project-page {
  min-height: 100vh;
  padding: 24px;
  background: #0E0F12;
  color: #D0D2D5;
  font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
}

/* HEADER */
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
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #C9A86A;
}

.page-subtitle {
  margin-top: 6px;
}

/* LAYOUT */
.project-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  gap: 20px;
}

/* CARD */
.card {
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 16px;
  padding: 18px;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.card__title {
  margin: 0;
  font-size: 18px;
  color: #C9A86A;
}

.card__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #9AA0A6;
}

/* INFO */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  padding: 12px;
  border-radius: 12px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
}

.info-item__label {
  font-size: 12px;
  color: #9AA0A6;
}

.info-item__value {
  margin-top: 6px;
  font-weight: 600;
  color: #D0D2D5;
}

/* STATUS */
.status-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
}

.status-badge--blue {
  color: #C9A86A;
  border-color: #C9A86A;
}

.status-badge--green {
  color: #C9A86A;
  border-color: #C9A86A;
}

/* TABLE */
.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #2A2D33;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  background: #16181C;
  min-width: 700px;
}

.project-table th {
  text-align: left;
  font-size: 12px;
  color: #9AA0A6;
  padding: 12px;
  border-bottom: 1px solid #2A2D33;
}

.project-table td {
  padding: 12px;
  border-bottom: 1px solid #2A2D33;
  color: #D0D2D5;
}

.project-table tr:hover td {
  background: #0E0F12;
}

.td-name {
  color: #C9A86A;
  font-weight: 600;
}

.td-amount {
  font-weight: 700;
}

.ta-right {
  text-align: right;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* FINANCE */
.finance-block {
  padding: 12px;
  border-radius: 12px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
}

.finance-block h3 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #C9A86A;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #2A2D33;
}

.finance-row:last-child {
  border-bottom: none;
}

.finance-row span {
  color: #9AA0A6;
}

.finance-row strong {
  color: #D0D2D5;
}

/* BUTTONS */
.btn {
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}

.btn--primary {
  background: #C9A86A;
  color: #0E0F12;
  border-color: #C9A86A;
}

.btn--ghost {
  background: transparent;
}

.btn--danger {
  background: #7A2E2E;
  border-color: #7A2E2E;
  color: #D0D2D5;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}

/* MODAL */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal__card {
  width: 100%;
  max-width: 720px;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 16px;
  padding: 16px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.icon-btn {
  background: transparent;
  border: 0;
  color: #D0D2D5;
}

/* FORM */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-field {
  display: grid;
  gap: 6px;
}

.form-field label {
  font-size: 12px;
  color: #9AA0A6;
}

input,
select {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 0 10px;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .project-layout {
    grid-template-columns: 1fr;
  }

  .form-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

