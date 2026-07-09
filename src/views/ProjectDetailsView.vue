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

  try {
    await store.initProjectDetails(projectId)
    await loadOperationTypes()
    await loadExpenses()
  } catch (error) {
    console.error('❌ Error loading project details:', error)
    alert(error?.message || 'Не удалось загрузить данные проекта')
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  store.clearCurrentProject()
})

/* ===================== */
/* FINANCE TYPES */
/* ===================== */

async function loadOperationTypes() {
  try {
    const data = await getOperationTypes()
    operationTypes.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('❌ Error loading operation types:', error)
    operationTypes.value = []
  }
}

function getTypeId(code) {
  return operationTypes.value.find(t => t.code === code)?.id
}

/* ===================== */
/* EXPENSES */
/* ===================== */

async function loadExpenses() {
  try {
    const all = await getTransactions()
    const allTransactions = Array.isArray(all) ? all : []

    const typeId = getTypeId('project_expense')

    transactions.value = allTransactions.filter(t =>
      t.project === projectId &&
      t.finance_operation_type === typeId
    )
  } catch (error) {
    console.error('❌ Error loading expenses:', error)
    transactions.value = []
  }
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
  expenseForm.name = ''
  expenseForm.amount = ''
  expenseForm.date = new Date().toISOString().split('T')[0]
  showExpenseModal.value = true
}

function closeExpenseModal() {
  showExpenseModal.value = false
}

/* ===================== */
/* SAVE EXPENSE */
/* ===================== */

async function saveExpense() {
  try {
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
  } catch (error) {
    console.error('❌ Error saving expense:', error)
    alert(error?.message || 'Не удалось сохранить расход')
  }
}

/* ===================== */
/* DELETE EXPENSE */
/* ===================== */

async function deleteExpense(id) {
  if (!confirm('Удалить этот расход?')) return

  try {
    await deleteTransaction(id)
    await loadExpenses()
  } catch (error) {
    console.error('❌ Error deleting expense:', error)
    alert(error?.message || 'Не удалось удалить расход')
  }
}

/* ===================== */
/* PROJECT ITEMS */
/* ===================== */

function openCreateItem() {
  itemForm.nomenclature = null
  itemForm.quantity = 1
  itemForm.fixed_cost_price = 0
  itemForm.fixed_sale_price = 0

  showItemModal.value = true
}

async function saveItem() {
  try {
    await store.createProjectItem({
      project: projectId,
      nomenclature: Number(itemForm.nomenclature),
      quantity: Number(itemForm.quantity),
      fixed_cost_price: Number(itemForm.fixed_cost_price),
      fixed_sale_price: Number(itemForm.fixed_sale_price),
    })

    showItemModal.value = false
  } catch (error) {
    console.error('❌ Error saving item:', error)
    alert(error?.message || 'Не удалось сохранить позицию')
  }
}

const editingItem = ref(null)

function openEditItem(item) {
  editingItem.value = item
  
  itemForm.nomenclature = item.nomenclature
  itemForm.quantity = item.quantity
  itemForm.fixed_cost_price = item.fixed_cost_price
  itemForm.fixed_sale_price = item.fixed_sale_price
  
  showItemModal.value = true
}

async function updateItem() {
  try {
    await store.updateProjectItem(editingItem.value.id, {
      nomenclature: Number(itemForm.nomenclature),
      quantity: Number(itemForm.quantity),
      fixed_cost_price: Number(itemForm.fixed_cost_price),
      fixed_sale_price: Number(itemForm.fixed_sale_price),
    })

    showItemModal.value = false
    editingItem.value = null
  } catch (error) {
    console.error('❌ Error updating item:', error)
    alert(error?.message || 'Не удалось обновить позицию')
  }
}

async function deleteItem(id) {
  if (!confirm('Удалить эту позицию?')) return

  try {
    await store.deleteProjectItem(id)
  } catch (error) {
    console.error('❌ Error deleting item:', error)
    alert(error?.message || 'Не удалось удалить позицию')
  }
}

function closeItemModal() {
  showItemModal.value = false
  editingItem.value = null
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
  try {
    await store.updateProject(projectId, {
      name: projectForm.name,
      geography: projectForm.geography,
      client: Number(projectForm.client),
      tech_manager: Number(projectForm.tech_manager),
      status: Number(projectForm.status),
    })

    showProjectModal.value = false
  } catch (error) {
    console.error('❌ Error updating project:', error)
    alert(error?.message || 'Не удалось обновить проект')
  }
}

/* ===================== */
/* STATUS BADGE */
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

          <!-- PROJECT EXPENSES -->
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

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeProjectModal">Отмена</button>
          <button class="btn btn--primary" @click="saveProject">
            Сохранить
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ITEM -->
    <div v-if="showItemModal" class="modal" @click.self="closeItemModal">
      <div class="modal__card modal__card--md">
        <div class="modal__header">
          <h3>{{ editingItem ? 'Редактировать позицию' : 'Новая позиция проекта' }}</h3>
          <button class="icon-btn" @click="closeItemModal">✕</button>
        </div>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label>Номенклатура</label>
            <select v-model="itemForm.nomenclature">
              <option disabled :value="null">Выберите товар</option>
              <option v-for="n in store.nomenclatures" :key="n.id" :value="n.id">
                {{ n.name }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label>Количество</label>
            <input type="number" v-model="itemForm.quantity" min="0" step="1" />
          </div>

          <div class="form-field">
            <label>Себестоимость</label>
            <input type="number" v-model="itemForm.fixed_cost_price" min="0" step="0.01" />
          </div>

          <div class="form-field form-field--full">
            <label>Цена продажи</label>
            <input type="number" v-model="itemForm.fixed_sale_price" min="0" step="0.01" />
          </div>
        </div>

        <div class="modal__actions">
          <button class="btn btn--ghost" @click="closeItemModal">
            Отмена
          </button>
          <button 
            class="btn btn--primary" 
            @click="editingItem ? updateItem() : saveItem()"
          >
            {{ editingItem ? 'Обновить' : 'Создать' }}
          </button>
        </div>
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

.page-header__right {
  display: flex;
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

/* LOADING */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #9AA0A6;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2A2D33;
  border-top-color: #C9A86A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* LAYOUT */
.project-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  gap: 20px;
}

.project-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-sidebar {
  display: flex;
  flex-direction: column;
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
  font-weight: 700;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
}

.info-item__label {
  font-size: 12px;
  color: #9AA0A6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item__value {
  font-weight: 600;
  color: #D0D2D5;
  font-size: 14px;
}

/* STATUS */
.status-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
}

.status-badge--blue {
  color: #6A9AC9;
  border-color: #6A9AC9;
  background: rgba(106, 154, 201, 0.1);
}

.status-badge--green {
  color: #6AC98E;
  border-color: #6AC98E;
  background: rgba(106, 201, 142, 0.1);
}

.status-badge--gray {
  color: #9AA0A6;
  border-color: #2A2D33;
  background: #0E0F12;
}

.status-badge--red {
  color: #C96A6A;
  border-color: #C96A6A;
  background: rgba(201, 106, 106, 0.1);
}

/* EMPTY STATE */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed #2A2D33;
  border-radius: 12px;
  background: #0E0F12;
}

.empty-state__title {
  font-size: 16px;
  font-weight: 600;
  color: #D0D2D5;
  margin-bottom: 8px;
}

.empty-state__text {
  font-size: 14px;
  color: #9AA0A6;
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
  font-weight: 600;
  color: #9AA0A6;
  padding: 12px;
  border-bottom: 1px solid #2A2D33;
  background: #0E0F12;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.project-table td {
  padding: 12px;
  border-bottom: 1px solid #2A2D33;
  color: #D0D2D5;
  font-size: 14px;
}

.project-table tbody tr:last-child td {
  border-bottom: none;
}

.project-table tbody tr:hover td {
  background: #0E0F12;
}

.td-name {
  color: #C9A86A;
  font-weight: 600;
}

.td-amount {
  font-weight: 700;
  color: #D0D2D5;
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
.finance-blocks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.finance-block {
  padding: 12px;
  border-radius: 12px;
  background: #0E0F12;
  border: 1px solid #2A2D33;
}

.finance-block h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #C9A86A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #2A2D33;
}

.finance-row:last-child {
  border-bottom: none;
}

.finance-row span {
  color: #9AA0A6;
  font-size: 13px;
}

.finance-row strong {
  color: #D0D2D5;
  font-size: 14px;
  font-weight: 600;
}

/* BUTTONS */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.btn:hover {
  background: #16181C;
  border-color: #C9A86A;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #C9A86A;
  color: #0E0F12;
  border-color: #C9A86A;
}

.btn--primary:hover {
  background: #D4B57A;
  border-color: #D4B57A;
}

.btn--ghost {
  background: transparent;
  border-color: transparent;
}

.btn--ghost:hover {
  background: #16181C;
  border-color: #2A2D33;
}

.btn--danger {
  background: #7A2E2E;
  border-color: #7A2E2E;
  color: #D0D2D5;
}

.btn--danger:hover {
  background: #8A3E3E;
  border-color: #8A3E3E;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}

/* MODAL */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal__card {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal__card--md {
  max-width: 560px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #2A2D33;
}

.modal__header h3 {
  margin: 0;
  font-size: 18px;
  color: #C9A86A;
}

.icon-btn {
  background: transparent;
  border: 0;
  color: #9AA0A6;
  cursor: pointer;
  font-size: 20px;
  padding: 4px 8px;
  transition: color 0.15s ease;
}

.icon-btn:hover {
  color: #D0D2D5;
}

.modal__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #2A2D33;
}

/* FORM */
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
  font-size: 12px;
  font-weight: 600;
  color: #9AA0A6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input,
select {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #2A2D33;
  background: #0E0F12;
  color: #D0D2D5;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: #C9A86A;
}

input:disabled,
select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 1;
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

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__right {
    width: 100%;
  }

  .page-header__right .btn {
    width: 100%;
  }

  .table-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .table-actions .btn {
    width: 100%;
  }

  .modal__actions {
    flex-direction: column-reverse;
  }

  .modal__actions .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .project-page {
    padding: 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .card {
    padding: 14px;
  }

  .card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .card__header .btn {
    width: 100%;
  }

  .table-wrap {
    border-radius: 8px;
  }

  .project-table {
    min-width: 600px;
  }
}
</style>