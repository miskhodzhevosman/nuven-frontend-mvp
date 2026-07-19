<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'
import { useFinanceStore } from '@/modules/finance/store'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const financeStore = useFinanceStore()

const { currentProject, projectItems, clientPayments, factoryPayments, projectExpenses, loading, error, nomenclatures } = storeToRefs(store)
const { report: financeReport } = storeToRefs(financeStore)

const projectId = computed(() => Number(route.params.id))

// --- Computed for finance report ---
const projectReport = computed(() => {
  if (!financeReport.value) return null
  
  const report = financeReport.value
  
  const plannedRevenue = report.planned?.revenue || 0
  const plannedCogs = report.planned?.cogs || 0
  const plannedGrossProfit = report.planned?.gross_profit || 0
  const plannedMargin = report.planned?.margin || 0
  
  const factClientReceived = report.fact?.client_received || 0
  const factFactoryPaid = report.fact?.factory_paid || 0
  const factProjectExpenses = report.fact?.project_expenses || 0
  
  const accountsReceivable = report.cashflow?.accounts_receivable || 0
  const accountsPayable = report.cashflow?.accounts_payable || 0
  
  const netProfit = report.net_profit || 0
  
  return {
    cogs: plannedCogs,
    grossProfit: plannedGrossProfit,
    margin: plannedMargin,
    clientReceived: factClientReceived,
    accountsReceivable: accountsReceivable,
    factoryPaid: factFactoryPaid,
    accountsPayable: accountsPayable,
    projectExpenses: factProjectExpenses,
    netProfit: netProfit,
    revenue: plannedRevenue,
  }
})

// --- Modals ---
const showItemForm = ref(false)
const editingItemId = ref(null)
const showNomenclatureForm = ref(false)
const showFactoryForm = ref(false)
const showPayFactory = ref(false)
const payingItem = ref(null)
const showProjectExpenseForm = ref(false)
const showClientPaymentForm = ref(false)
const confirmDeleteItemId = ref(null)
const showEditProjectForm = ref(false)

// --- Forms ---
const emptyItemForm = () => ({
  nomenclature: '',
  quantity: '1',
  fixed_cost_price: '',
  fixed_sale_price: '',
})
const itemForm = reactive(emptyItemForm())
const itemFormRef = ref(null)

// --- Autocomplete state for nomenclature ---
const nomenclatureSearch = ref('')
const showNomenclatureSuggestions = ref(false)
const selectedNomenclature = ref(null)

// --- Computed for nomenclature autocomplete ---
const filteredNomenclatures = computed(() => {
  if (!nomenclatures.value) return []
  if (!nomenclatureSearch.value) return nomenclatures.value.slice(0, 10)
  const search = nomenclatureSearch.value.toLowerCase().trim()
  return nomenclatures.value
    .filter(n => 
      n.name.toLowerCase().includes(search) || 
      (n.article && n.article.toLowerCase().includes(search))
    )
    .slice(0, 10)
})

// --- Nomenclature autocomplete methods ---
const onNomenclatureInput = () => {
  if (selectedNomenclature.value && nomenclatureSearch.value !== selectedNomenclature.value.name) {
    selectedNomenclature.value = null
    itemForm.nomenclature = ''
    // Очищаем цены при смене выбора
    if (!editingItemId.value) {
      itemForm.fixed_cost_price = ''
      itemForm.fixed_sale_price = ''
    }
  }
  showNomenclatureSuggestions.value = true
}

const onNomenclatureBlur = () => {
  setTimeout(() => {
    showNomenclatureSuggestions.value = false
    if (nomenclatureSearch.value && !selectedNomenclature.value) {
      const found = nomenclatures.value.find(n => 
        n.name.toLowerCase() === nomenclatureSearch.value.toLowerCase().trim()
      )
      if (found) {
        selectNomenclature(found)
      }
    }
  }, 200)
}

const toggleNomenclatureSuggestions = () => {
  showNomenclatureSuggestions.value = !showNomenclatureSuggestions.value
  if (showNomenclatureSuggestions.value && !nomenclatureSearch.value) {
    nomenclatureSearch.value = ''
  }
}

const selectNomenclature = (nomenclature) => {
  selectedNomenclature.value = nomenclature
  nomenclatureSearch.value = nomenclature.name
  itemForm.nomenclature = nomenclature.id
  
  // Подтягиваем цены из номенклатуры
  if (!editingItemId.value) {
    itemForm.fixed_cost_price = nomenclature.current_cost_price || ''
    itemForm.fixed_sale_price = nomenclature.current_sale_price || ''
  }
  
  showNomenclatureSuggestions.value = false
}

// --- Watch for nomenclature change to auto-fill prices ---
watch(() => itemForm.nomenclature, (newValue) => {
  if (newValue && !editingItemId.value && !selectedNomenclature.value) {
    const nomenclature = nomenclatures.value.find(n => n.id === Number(newValue))
    if (nomenclature) {
      if (!itemForm.fixed_cost_price) {
        itemForm.fixed_cost_price = nomenclature.current_cost_price || ''
      }
      if (!itemForm.fixed_sale_price) {
        itemForm.fixed_sale_price = nomenclature.current_sale_price || ''
      }
    }
  }
}, { immediate: true })

const emptyNomenclatureForm = () => ({
  name: '',
  technical_name: '',
  type: 'PRODUCT',
  article: '',
  factory: '',
  current_cost_price: '',
  current_sale_price: '',
})
const nomenclatureForm = reactive(emptyNomenclatureForm())
const nomenclatureFormRef = ref(null)

const emptyFactoryForm = () => ({ name: '', address: '', contacts: '' })
const factoryForm = reactive(emptyFactoryForm())
const factoryFormRef = ref(null)

const emptyPaymentForm = () => ({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
  counterparty_id: '',
})
const paymentForm = reactive(emptyPaymentForm())
const paymentFormRef = ref(null)

const emptyExpenseForm = () => ({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  comment: '',
  counterparty_id: '',
  expense_type_name: '',
})
const expenseForm = reactive(emptyExpenseForm())
const expenseFormRef = ref(null)

// Edit project form
const editProjectForm = reactive({
  name: '',
  client: '',
  status: '',
  tech_manager: '',
  location: '',
  full_location_name: '',
  created_at: '',
})
const editFormRef = ref(null)

function getProfitClass(value) {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

// Location autocomplete state for edit form
const editLocationSearch = ref('')
const editShowLocationSuggestions = ref(false)
const editSelectedLocation = ref(null)

// --- Combobox state for expense type ---
const expenseTypeSearch = ref('')
const showExpenseTypeSuggestions = ref(false)
const selectedExpenseType = ref(null)

// --- Computed for edit form ---
const editFilteredClients = computed(() => {
  if (!store.clients) return []
  return store.clients.filter(c => c.type === 'CLIENT')
})

const editFilteredLocations = computed(() => {
  if (!store.locations) return []
  return store.locations.filter(l => l.type === 'CITY')
})

const editFilteredLocationSuggestions = computed(() => {
  if (!editLocationSearch.value) return editFilteredLocations.value.slice(0, 10)
  const search = editLocationSearch.value.toLowerCase().trim()
  return editFilteredLocations.value
    .filter(l => l.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// --- Helpers ---
function formatAmount(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)
}

function formatCurrency(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)
}

function formatPercent(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) + '%' : String(v)
}

function formatDate(d) { return d ? d.slice(0, 10) : '—' }
function nomenclatureFactoryId(item) {
  const n = store.nomenclatureById(item.nomenclature)
  return n?.factory ?? null
}

// --- Expense type computed ---
const filteredExpenseTypes = computed(() => {
  if (!expenseTypeSearch.value) return store.expenseTypes
  const search = expenseTypeSearch.value.toLowerCase().trim()
  return store.expenseTypes.filter(t => 
    t.name.toLowerCase().includes(search)
  ).slice(0, 10)
})

const isExpenseTypeExists = computed(() => {
  if (!expenseTypeSearch.value) return false
  return store.expenseTypes.some(t => 
    t.name.toLowerCase() === expenseTypeSearch.value.toLowerCase().trim()
  )
})

// --- Expense type methods ---
const onExpenseTypeInput = () => {
  if (selectedExpenseType.value && expenseTypeSearch.value !== selectedExpenseType.value.name) {
    selectedExpenseType.value = null
    expenseForm.expense_type_name = ''
  }
  showExpenseTypeSuggestions.value = true
}

const onExpenseTypeBlur = () => {
  setTimeout(() => {
    showExpenseTypeSuggestions.value = false
    if (expenseTypeSearch.value && !selectedExpenseType.value) {
      if (!isExpenseTypeExists.value) {
        expenseForm.expense_type_name = expenseTypeSearch.value.trim()
      } else {
        const found = store.expenseTypes.find(t => 
          t.name.toLowerCase() === expenseTypeSearch.value.toLowerCase().trim()
        )
        if (found) {
          selectExpenseType(found)
        }
      }
    }
  }, 200)
}

const toggleExpenseTypeSuggestions = () => {
  showExpenseTypeSuggestions.value = !showExpenseTypeSuggestions.value
  if (showExpenseTypeSuggestions.value && !expenseTypeSearch.value) {
    expenseTypeSearch.value = ''
  }
}

const selectExpenseType = (type) => {
  selectedExpenseType.value = type
  expenseTypeSearch.value = type.name
  expenseForm.expense_type_name = type.name
  showExpenseTypeSuggestions.value = false
}

const createNewExpenseType = () => {
  if (expenseTypeSearch.value && expenseTypeSearch.value.trim()) {
    const name = expenseTypeSearch.value.trim()
    selectedExpenseType.value = { id: 'new', name }
    expenseForm.expense_type_name = name
    showExpenseTypeSuggestions.value = false
  }
}

// --- Edit location autocomplete methods ---
const onEditLocationInput = () => {
  if (editSelectedLocation.value && editLocationSearch.value !== editSelectedLocation.value.name) {
    editSelectedLocation.value = null
    editProjectForm.location = ''
  }
  editShowLocationSuggestions.value = true
}

const onEditLocationBlur = () => {
  setTimeout(() => {
    editShowLocationSuggestions.value = false
    if (editLocationSearch.value && !editSelectedLocation.value) {
      const found = editFilteredLocations.value.find(l => 
        l.name.toLowerCase() === editLocationSearch.value.toLowerCase().trim()
      )
      if (found) {
        editSelectLocation(found)
      }
    }
  }, 200)
}

const toggleEditLocationSuggestions = () => {
  editShowLocationSuggestions.value = !editShowLocationSuggestions.value
  if (editShowLocationSuggestions.value && !editLocationSearch.value) {
    editLocationSearch.value = ''
  }
}

const editSelectLocation = (location) => {
  editSelectedLocation.value = location
  editLocationSearch.value = location.name
  editProjectForm.location = location.id
  editShowLocationSuggestions.value = false
}

// --- Refresh all data ---
async function refreshAllData() {
  try {
    await Promise.all([
      store.fetchProjectItems(projectId.value),
      store.fetchClientPayments(projectId.value),
      store.fetchFactoryPayments(projectId.value),
      store.fetchProjectExpenses(projectId.value),
    ])
    await financeStore.fetchProjectReport(projectId.value)
  } catch (e) {
    console.error('Failed to refresh data:', e)
  }
}

// --- Project items ---
function openCreateItem() {
  editingItemId.value = null
  Object.assign(itemForm, emptyItemForm())
  nomenclatureSearch.value = ''
  selectedNomenclature.value = null
  showNomenclatureSuggestions.value = false
  showItemForm.value = true
}

function openEditItem(item) {
  editingItemId.value = item.id
  const nomenclature = nomenclatures.value.find(n => n.id === item.nomenclature)
  if (nomenclature) {
    nomenclatureSearch.value = nomenclature.name
    selectedNomenclature.value = nomenclature
  }
  itemForm.nomenclature = item.nomenclature ?? ''
  itemForm.quantity = item.quantity ?? '1'
  itemForm.fixed_cost_price = item.fixed_cost_price ?? ''
  itemForm.fixed_sale_price = item.fixed_sale_price ?? ''
  showItemForm.value = true
}

function closeItemForm() { 
  showItemForm.value = false
  editingItemId.value = null
  Object.assign(itemForm, emptyItemForm())
  nomenclatureSearch.value = ''
  selectedNomenclature.value = null
  showNomenclatureSuggestions.value = false
}

async function submitItem() {
  if (!itemFormRef.value?.checkValidity()) return
  const payload = {
    project: projectId.value,
    nomenclature: Number(itemForm.nomenclature),
    quantity: String(itemForm.quantity),
    fixed_cost_price: itemForm.fixed_cost_price ? String(itemForm.fixed_cost_price) : null,
    fixed_sale_price: itemForm.fixed_sale_price ? String(itemForm.fixed_sale_price) : null,
  }
  try {
    if (editingItemId.value) {
      await store.updateProjectItem(editingItemId.value, payload)
    } else {
      await store.createProjectItem(payload)
    }
    closeItemForm()
    await refreshAllData()
  } catch (e) {
    console.error('Failed to save item:', e)
  }
}

async function deleteItem(id) {
  try { 
    await store.deleteProjectItem(id)
    await refreshAllData()
  } finally { 
    confirmDeleteItemId.value = null 
  }
}

// --- Nomenclature (inside item form) ---
function openCreateNomenclature() {
  Object.assign(nomenclatureForm, emptyNomenclatureForm())
  showNomenclatureForm.value = true
}
function closeNomenclatureForm() { showNomenclatureForm.value = false }

async function submitNomenclature() {
  if (!nomenclatureFormRef.value?.checkValidity()) return
  const payload = {
    name: nomenclatureForm.name,
    technical_name: nomenclatureForm.technical_name || '',
    type: nomenclatureForm.type,
    article: nomenclatureForm.article || null,
    factory: nomenclatureForm.factory ? Number(nomenclatureForm.factory) : null,
    current_cost_price: nomenclatureForm.current_cost_price ? String(nomenclatureForm.current_cost_price) : null,
    current_sale_price: nomenclatureForm.current_sale_price ? String(nomenclatureForm.current_sale_price) : null,
  }
  try {
    const created = await store.createNomenclature(payload)
    // Обновляем список номенклатур
    await store.fetchNomenclatures()
    // Выбираем созданную номенклатуру
    selectNomenclature(created)
    closeNomenclatureForm()
  } catch (e) {
    console.error('Failed to create nomenclature:', e)
  }
}

// --- Factory (inside nomenclature form) ---
function openCreateFactory() {
  Object.assign(factoryForm, emptyFactoryForm())
  showFactoryForm.value = true
}
function closeFactoryForm() { showFactoryForm.value = false }

async function submitFactory() {
  if (!factoryFormRef.value?.checkValidity()) return
  try {
    const created = await store.createFactory({
      name: factoryForm.name,
      address: factoryForm.address || '',
      contacts: factoryForm.contacts || '',
    })
    await store.fetchFactories()
    nomenclatureForm.factory = created.id
    closeFactoryForm()
  } catch (e) {
    console.error('Failed to create factory:', e)
  }
}

// --- Pay factory (from item) ---
function openPayFactory(item) {
  payingItem.value = item
  const factoryId = nomenclatureFactoryId(item)
  Object.assign(paymentForm, emptyPaymentForm())
  paymentForm.counterparty_id = factoryId || ''
  const cost = Number(item.fixed_cost_price ?? 0)
  const qty = Number(item.quantity ?? 0)
  if (cost && qty) paymentForm.amount = String((cost * qty).toFixed(2))
  showPayFactory.value = true
}
function closePayFactory() { showPayFactory.value = false; payingItem.value = null }

async function submitPayFactory() {
  if (!paymentFormRef.value?.checkValidity()) return
  const payload = {
    project_id: projectId.value,
    amount: String(paymentForm.amount),
    date: paymentForm.date,
    counterparty_id: paymentForm.counterparty_id ? Number(paymentForm.counterparty_id) : null,
    comment: paymentForm.comment || null,
  }
  try {
    await store.createFactoryPayment(payload)
    closePayFactory()
    await refreshAllData()
  } catch (e) {
    console.error('Failed to create factory payment:', e)
  }
}

// --- Project expenses ---
function openProjectExpense() {
  Object.assign(expenseForm, emptyExpenseForm())
  expenseTypeSearch.value = ''
  selectedExpenseType.value = null
  showExpenseTypeSuggestions.value = false
  showProjectExpenseForm.value = true
  store.fetchExpenseTypes()
}
function closeProjectExpenseForm() { 
  showProjectExpenseForm.value = false
  expenseTypeSearch.value = ''
  selectedExpenseType.value = null
  showExpenseTypeSuggestions.value = false
}

async function submitProjectExpense() {
  if (!expenseForm.expense_type_name) {
    error.value = 'Пожалуйста, укажите тип расхода'
    return
  }
  if (!expenseFormRef.value?.checkValidity()) return
  const payload = {
    project_id: projectId.value,
    amount: String(expenseForm.amount),
    date: expenseForm.date,
    expense_type_name: expenseForm.expense_type_name,
    counterparty_id: expenseForm.counterparty_id ? Number(expenseForm.counterparty_id) : null,
    comment: expenseForm.comment || null,
  }
  try {
    await store.createProjectExpense(payload)
    closeProjectExpenseForm()
    await refreshAllData()
  } catch (e) {
    console.error('Failed to create project expense:', e)
  }
}

// --- Client payments ---
function openClientPayment() {
  Object.assign(paymentForm, emptyPaymentForm())
  showClientPaymentForm.value = true
}
function closeClientPaymentForm() { showClientPaymentForm.value = false }

async function submitClientPayment() {
  if (!paymentFormRef.value?.checkValidity()) return
  const payload = {
    project_id: projectId.value,
    amount: String(paymentForm.amount),
    date: paymentForm.date,
    counterparty_id: paymentForm.counterparty_id ? Number(paymentForm.counterparty_id) : null,
    comment: paymentForm.comment || null,
  }
  try {
    await store.createClientPayment(payload)
    closeClientPaymentForm()
    await refreshAllData()
  } catch (e) {
    console.error('Failed to create client payment:', e)
  }
}

// --- Edit project ---
function openEditProject() {
  if (!currentProject.value) return
  
  editProjectForm.name = currentProject.value.name || ''
  editProjectForm.client = currentProject.value.client || ''
  editProjectForm.status = currentProject.value.status || ''
  editProjectForm.tech_manager = currentProject.value.tech_manager || ''
  editProjectForm.location = currentProject.value.location || ''
  editProjectForm.full_location_name = currentProject.value.full_location_name || ''
  editProjectForm.created_at = currentProject.value.created_at ? currentProject.value.created_at.slice(0, 16) : ''
  
  if (currentProject.value.location) {
    const loc = store.locations.find(l => l.id === currentProject.value.location)
    if (loc) {
      editSelectedLocation.value = loc
      editLocationSearch.value = loc.name
    }
  } else {
    editLocationSearch.value = ''
    editSelectedLocation.value = null
  }
  
  showEditProjectForm.value = true
}

function closeEditProjectForm() {
  showEditProjectForm.value = false
  editLocationSearch.value = ''
  editSelectedLocation.value = null
  editShowLocationSuggestions.value = false
}

async function submitEditProject() {
  if (!editFormRef.value?.checkValidity()) return
  
  const payload = {
    name: editProjectForm.name,
    client: editProjectForm.client ? Number(editProjectForm.client) : null,
    status: editProjectForm.status ? Number(editProjectForm.status) : null,
    tech_manager: editProjectForm.tech_manager ? Number(editProjectForm.tech_manager) : null,
    location: editProjectForm.location ? Number(editProjectForm.location) : null,
    full_location_name: editProjectForm.full_location_name || '',
    created_at: editProjectForm.created_at || null,
  }
  
  try {
    await store.updateProject(projectId.value, payload)
    closeEditProjectForm()
    await store.fetchProject(projectId.value)
    await refreshAllData()
  } catch (e) {
    console.error('Failed to update project:', e)
  }
}

// --- Init ---
async function loadAll() {
  try {
    await Promise.all([
      store.fetchProject(projectId.value),
      store.fetchStatuses(),
      store.fetchClients(),
      store.fetchNomenclatures(),
      store.fetchFactories(),
      store.fetchManagers(),
      store.fetchLocations(),
      store.fetchExpenseTypes(),
    ])
    await refreshAllData()
  } catch (e) {
    console.error('Failed to load data:', e)
  }
}

onMounted(loadAll)
watch(projectId, loadAll)
</script>

<template>
  <section class="page">
    <div class="topbar">
      <button class="btn btn-ghost" @click="router.push({ name: 'projects' })">← Назад к проектам</button>
      <button class="btn btn-primary" @click="openEditProject">✎ Редактировать проект</button>
    </div>

    <div v-if="error" class="alert alert-error"><strong>Ошибка:</strong> <span>{{ error }}</span></div>
    <div v-if="loading && !currentProject" class="state">Загрузка…</div>

    <template v-if="currentProject">
      <h1>{{ currentProject.name }}</h1>

      <!-- Информация о проекте -->
      <section class="card">
        <h2>Информация о проекте</h2>
        <div class="info-grid">
          <div><span class="label">ID</span><span>{{ currentProject.id }}</span></div>
          <div><span class="label">Клиент</span><span>{{ store.clientName(currentProject.client) }}</span></div>
          <div><span class="label">Статус</span><span>{{ store.statusName(currentProject.status) }}</span></div>
          <div><span class="label">Локация</span><span>{{ currentProject.full_location_name || '—' }}</span></div>
          <div><span class="label">Тех. менеджер</span><span>{{ store.managerName(currentProject.tech_manager) }}</span></div>
          <div><span class="label">Создан</span><span>{{ formatDate(currentProject.created_at) }}</span></div>
          <div><span class="label">Обновлен</span><span>{{ formatDate(currentProject.updated_at) }}</span></div>
        </div>
      </section>

      <!-- Финансовый отчет - Правая колонка -->
<div class="main-layout">
  <!-- Левая колонка -->
  <div class="left-column">
    <!-- Позиции проекта -->
    <section class="card">
      <div class="card-header">
        <h2>Позиции проекта</h2>
        <button class="btn btn-primary" @click="openCreateItem">+ Добавить позицию</button>
      </div>

      <div v-if="!projectItems.length" class="state muted">Нет позиций.</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Товар</th>
              <th class="num">Кол-во</th>
              <th class="num">Себест.</th>
              <th class="num">Продажа</th>
              <th>Фабрика</th>
              <th class="actions">Операции</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in projectItems" :key="item.id">
              <td>{{ store.nomenclatureName(item.nomenclature) }}</td>
              <td class="num">{{ item.quantity }}</td>
              <td class="num">{{ formatAmount(item.fixed_cost_price) }}</td>
              <td class="num">{{ formatAmount(item.fixed_sale_price) }}</td>
              <td>{{ store.factoryName(nomenclatureFactoryId(item)) }}</td>
              <td class="actions">
                <button class="btn btn-ghost" @click="openEditItem(item)">Редактировать</button>
                <button class="btn btn-danger" @click="confirmDeleteItemId = item.id">Удалить</button>
                <button class="btn btn-pay" @click="openPayFactory(item)">Оплатить</button>
                <span v-if="confirmDeleteItemId === item.id" class="confirm">
                  Точно?
                  <button class="btn btn-danger" @click="deleteItem(item.id)">Да</button>
                  <button class="btn btn-ghost" @click="confirmDeleteItemId = null">Нет</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Проектные расходы -->
    <section class="card">
      <div class="card-header">
        <h2>Проектные расходы</h2>
        <button class="btn btn-primary" @click="openProjectExpense">+ Добавить расход</button>
      </div>
      <div v-if="!projectExpenses.length" class="state muted">Нет расходов.</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Дата</th><th class="num">Сумма</th><th>Тип расхода</th><th>Комментарий</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in projectExpenses" :key="e.id">
              <td>{{ formatDate(e.date) }}</td>
              <td class="num">{{ formatAmount(e.amount) }}</td>
              <td>{{ e.operation_type_name || e.finance_operation_type || '—' }}</td>
              <td>{{ e.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Оплаты клиентов -->
    <section class="card">
      <div class="card-header">
        <h2>Оплаты клиентов</h2>
        <button class="btn btn-primary" @click="openClientPayment">+ Добавить оплату</button>
      </div>
      <div v-if="!clientPayments.length" class="state muted">Нет оплат.</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Дата</th><th class="num">Сумма</th><th>Контрагент</th><th>Комментарий</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in clientPayments" :key="p.id">
              <td>{{ formatDate(p.date) }}</td>
              <td class="num">{{ formatAmount(p.amount) }}</td>
              <td>{{ p.counterparty ?? '—' }}</td>
              <td>{{ p.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Оплаты фабрикам -->
    <section class="card">
      <div class="card-header">
        <h2>Оплаты фабрикам</h2>
      </div>
      <div v-if="!factoryPayments.length" class="state muted">Нет оплат.</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Дата</th><th class="num">Сумма</th><th>Контрагент</th><th>Комментарий</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in factoryPayments" :key="p.id">
              <td>{{ formatDate(p.date) }}</td>
              <td class="num">{{ formatAmount(p.amount) }}</td>
              <td>{{ p.counterparty ?? '—' }}</td>
              <td>{{ p.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- Правая колонка - Финансовый отчет -->
  <div class="right-column">
    <section class="report-card">
      <h2>📊 Финансовый отчет</h2>
      <div v-if="financeStore.loading" class="state muted">Загрузка…</div>
      <div v-else-if="projectReport" class="report-grid">
        <div class="report-item">
          <span class="report-label">Себестоимость</span>
          <span class="report-value">{{ formatCurrency(projectReport.cogs) }}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Валовая прибыль</span>
          <span class="report-value" :class="getProfitClass(projectReport.grossProfit)">
            {{ formatCurrency(projectReport.grossProfit) }}
          </span>
        </div>
        <div class="report-item">
          <span class="report-label">Маржа</span>
          <span class="report-value gold">{{ formatPercent(projectReport.margin) }}</span>
        </div>
        <hr class="report-divider" />
        <div class="report-item">
          <span class="report-label">Получено от клиента</span>
          <span class="report-value positive">{{ formatCurrency(projectReport.clientReceived) }}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Дебиторская задолженность</span>
          <span class="report-value">{{ formatCurrency(projectReport.accountsReceivable) }}</span>
        </div>
        <hr class="report-divider" />
        <div class="report-item">
          <span class="report-label">Оплачено фабрикам</span>
          <span class="report-value negative">{{ formatCurrency(projectReport.factoryPaid) }}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Кредиторская задолженность</span>
          <span class="report-value">{{ formatCurrency(projectReport.accountsPayable) }}</span>
        </div>
        <hr class="report-divider" />
        <div class="report-item">
          <span class="report-label">Расходы</span>
          <span class="report-value negative">{{ formatCurrency(projectReport.projectExpenses) }}</span>
        </div>
        <div class="report-item total">
          <span class="report-label">Чистая прибыль</span>
          <span class="report-value" :class="getProfitClass(projectReport.netProfit)">
            {{ formatCurrency(projectReport.netProfit) }}
          </span>
        </div>
      </div>
      <div v-else class="state muted">Нет данных</div>
    </section>
  </div>
</div>


    </template>

    <!-- Модалка: позиция проекта -->
    <div v-if="showItemForm" class="modal-backdrop" @click.self="closeItemForm">
      <div class="modal">
        <h2>{{ editingItemId ? 'Редактировать позицию' : 'Новая позиция' }}</h2>
        <form ref="itemFormRef" @submit.prevent="submitItem">
          <label class="field">
            <span>Товар *</span>
            <div class="combobox-wrapper">
              <input
                v-model="nomenclatureSearch"
                type="text"
                placeholder="Введите или выберите товар"
                @input="onNomenclatureInput"
                @focus="showNomenclatureSuggestions = true"
                @blur="onNomenclatureBlur"
                required
                autocomplete="off"
              />
              <button 
                type="button" 
                class="combobox-toggle" 
                @mousedown.prevent="toggleNomenclatureSuggestions"
              >
                ▼
              </button>
              <ul v-if="showNomenclatureSuggestions && filteredNomenclatures.length > 0" class="combobox-suggestions">
                <li 
                  v-for="n in filteredNomenclatures" 
                  :key="n.id"
                  @mousedown.prevent="selectNomenclature(n)"
                >
                  <span class="suggestion-name">{{ n.name }}</span>
                  <span v-if="n.article" class="suggestion-article">{{ n.article }}</span>
                  <span class="suggestion-prices">
                    {{ n.current_cost_price ? formatAmount(n.current_cost_price) : '—' }} / 
                    {{ n.current_sale_price ? formatAmount(n.current_sale_price) : '—' }}
                  </span>
                </li>
                <li 
                  @mousedown.prevent="openCreateNomenclature"
                  class="combobox-create-new"
                >
                  ✚ Создать новый товар
                </li>
              </ul>
            </div>
            <small v-if="selectedNomenclature" class="hint success">
              Выбран: {{ selectedNomenclature.name }}
              <span v-if="selectedNomenclature.article">({{ selectedNomenclature.article }})</span>
            </small>
          </label>
          <label class="field"><span>Количество *</span>
            <input v-model="itemForm.quantity" type="number" step="0.01" min="0" required />
          </label>
          <label class="field">
            <span>Фикс. себестоимость</span>
            <input v-model="itemForm.fixed_cost_price" type="number" step="0.01" />
            <small class="hint">Можно редактировать</small>
          </label>
          <label class="field">
            <span>Фикс. цена продажи</span>
            <input v-model="itemForm.fixed_sale_price" type="number" step="0.01" />
            <small class="hint">Можно редактировать</small>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeItemForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Сохранить</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: новый товар -->
    <div v-if="showNomenclatureForm" class="modal-backdrop" @click.self="closeNomenclatureForm">
      <div class="modal">
        <h2>Новый товар</h2>
        <form ref="nomenclatureFormRef" @submit.prevent="submitNomenclature">
          <label class="field"><span>Название *</span>
            <input v-model="nomenclatureForm.name" required maxlength="255" />
          </label>
          <label class="field"><span>Техническое название</span>
            <input v-model="nomenclatureForm.technical_name" maxlength="255" />
          </label>
          <label class="field"><span>Тип *</span>
            <select v-model="nomenclatureForm.type">
              <option value="PRODUCT">Товар</option>
              <option value="SERVICE">Услуга</option>
            </select>
          </label>
          <label class="field"><span>Артикул</span>
            <input v-model="nomenclatureForm.article" maxlength="100" />
          </label>
          <label class="field"><span>Фабрика</span>
            <div class="row">
              <select v-model="nomenclatureForm.factory">
                <option value="">— не указана —</option>
                <option v-for="f in store.factories" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
              <button type="button" class="btn btn-ghost" @click="openCreateFactory">+ Новая фабрика</button>
            </div>
          </label>
          <label class="field"><span>Текущая себестоимость</span>
            <input v-model="nomenclatureForm.current_cost_price" type="number" step="0.01" />
          </label>
          <label class="field"><span>Текущая цена продажи</span>
            <input v-model="nomenclatureForm.current_sale_price" type="number" step="0.01" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeNomenclatureForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: новая фабрика -->
    <div v-if="showFactoryForm" class="modal-backdrop" @click.self="closeFactoryForm">
      <div class="modal">
        <h2>Новая фабрика</h2>
        <form ref="factoryFormRef" @submit.prevent="submitFactory">
          <label class="field"><span>Название *</span>
            <input v-model="factoryForm.name" required maxlength="255" />
          </label>
          <label class="field"><span>Адрес</span>
            <input v-model="factoryForm.address" />
          </label>
          <label class="field"><span>Контакты</span>
            <input v-model="factoryForm.contacts" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeFactoryForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: оплата фабрике -->
    <div v-if="showPayFactory" class="modal-backdrop" @click.self="closePayFactory">
      <div class="modal">
        <h2>Оплата фабрике</h2>
        <p class="muted" v-if="payingItem">
          Товар: {{ store.nomenclatureName(payingItem.nomenclature) }}<br />
          Фабрика: {{ store.factoryName(nomenclatureFactoryId(payingItem)) }}
        </p>
        <form ref="paymentFormRef" @submit.prevent="submitPayFactory">
          <label class="field"><span>Сумма *</span>
            <input v-model="paymentForm.amount" type="number" step="0.01" required />
          </label>
          <label class="field"><span>Дата *</span>
            <input v-model="paymentForm.date" type="date" required />
          </label>
          <label class="field"><span>Контрагент (фабрика)</span>
            <select v-model="paymentForm.counterparty_id">
              <option value="">— не указан —</option>
              <option v-for="f in store.factories" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </label>
          <label class="field"><span>Комментарий</span>
            <textarea v-model="paymentForm.comment" rows="2"></textarea>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closePayFactory">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Оплатить</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: проектный расход -->
    <div v-if="showProjectExpenseForm" class="modal-backdrop" @click.self="closeProjectExpenseForm">
      <div class="modal">
        <h2>Проектный расход</h2>
        <form ref="expenseFormRef" @submit.prevent="submitProjectExpense">
          <label class="field"><span>Сумма *</span>
            <input v-model="expenseForm.amount" type="number" step="0.01" required />
          </label>
          <label class="field"><span>Дата *</span>
            <input v-model="expenseForm.date" type="date" required />
          </label>
          
          <label class="field">
            <span>Тип расхода *</span>
            <div class="combobox-wrapper">
              <input
                v-model="expenseTypeSearch"
                type="text"
                placeholder="Введите или выберите тип расхода"
                @input="onExpenseTypeInput"
                @focus="showExpenseTypeSuggestions = true"
                @blur="onExpenseTypeBlur"
                required
              />
              <button 
                type="button" 
                class="combobox-toggle" 
                @mousedown.prevent="toggleExpenseTypeSuggestions"
              >
                ▼
              </button>
              <ul v-if="showExpenseTypeSuggestions && filteredExpenseTypes.length > 0" class="combobox-suggestions">
                <li 
                  v-for="type in filteredExpenseTypes" 
                  :key="type.id"
                  @mousedown.prevent="selectExpenseType(type)"
                >
                  {{ type.name }}
                </li>
                <li 
                  v-if="expenseTypeSearch && !isExpenseTypeExists"
                  @mousedown.prevent="createNewExpenseType"
                  class="combobox-create-new"
                >
                  ✚ Создать "{{ expenseTypeSearch }}"
                </li>
              </ul>
            </div>
            <small v-if="expenseTypeSearch && !isExpenseTypeExists" class="hint">
              Будет создан новый тип расхода "{{ expenseTypeSearch }}"
            </small>
            <small v-else-if="selectedExpenseType" class="hint success">
              Выбран тип: {{ selectedExpenseType.name }}
            </small>
          </label>

          <label class="field"><span>Контрагент</span>
            <select v-model="expenseForm.counterparty_id">
              <option value="">— не указан —</option>
              <option v-for="c in store.clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="field"><span>Комментарий</span>
            <textarea v-model="expenseForm.comment" rows="2"></textarea>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeProjectExpenseForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading || !expenseForm.expense_type_name">
              Создать
            </button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: оплата клиента -->
    <div v-if="showClientPaymentForm" class="modal-backdrop" @click.self="closeClientPaymentForm">
      <div class="modal">
        <h2>Оплата клиента</h2>
        <form ref="paymentFormRef" @submit.prevent="submitClientPayment">
          <label class="field"><span>Сумма *</span>
            <input v-model="paymentForm.amount" type="number" step="0.01" required />
          </label>
          <label class="field"><span>Дата *</span>
            <input v-model="paymentForm.date" type="date" required />
          </label>
          <label class="field"><span>Контрагент (клиент)</span>
            <select v-model="paymentForm.counterparty_id">
              <option value="">— не указан —</option>
              <option v-for="c in store.clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="field"><span>Комментарий</span>
            <textarea v-model="paymentForm.comment" rows="2"></textarea>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeClientPaymentForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: Редактирование проекта -->
    <div v-if="showEditProjectForm" class="modal-backdrop" @click.self="closeEditProjectForm">
      <div class="modal">
        <h2>Редактировать проект</h2>
        <form ref="editFormRef" @submit.prevent="submitEditProject">
          <label class="field">
            <span>Название проекта *</span>
            <input v-model="editProjectForm.name" type="text" required maxlength="255" placeholder="Введите название проекта" />
          </label>
          
          <label class="field">
            <span>Клиент</span>
            <select v-model="editProjectForm.client">
              <option value="">— не выбран —</option>
              <option v-for="c in editFilteredClients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <small class="hint">Показываются только контрагенты с типом "Client"</small>
          </label>
          
          <label class="field">
            <span>Статус</span>
            <select v-model="editProjectForm.status">
              <option value="">— не выбран —</option>
              <option v-for="s in store.statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>
          
          <label class="field">
            <span>Технический менеджер</span>
            <select v-model="editProjectForm.tech_manager">
              <option value="">— не выбран —</option>
              <option v-for="m in store.managers" :key="m.id" :value="m.id">{{ m.full_name || m.name }}</option>
            </select>
          </label>
          
          <label class="field">
            <span>Локация</span>
            <div class="combobox-wrapper">
              <input
                v-model="editLocationSearch"
                type="text"
                placeholder="Введите или выберите локацию"
                @input="onEditLocationInput"
                @focus="editShowLocationSuggestions = true"
                @blur="onEditLocationBlur"
                autocomplete="off"
              />
              <button 
                type="button" 
                class="combobox-toggle" 
                @mousedown.prevent="toggleEditLocationSuggestions"
              >
                ▼
              </button>
              <ul v-if="editShowLocationSuggestions && editFilteredLocationSuggestions.length > 0" class="combobox-suggestions">
                <li 
                  v-for="location in editFilteredLocationSuggestions" 
                  :key="location.id"
                  @mousedown.prevent="editSelectLocation(location)"
                >
                  {{ location.name }}
                </li>
              </ul>
            </div>
            <small v-if="editSelectedLocation" class="hint success">
              Выбрана локация: {{ editSelectedLocation.name }}
            </small>
            <small v-else-if="editLocationSearch && !editSelectedLocation" class="hint">
              Начните вводить название для поиска
            </small>
            <small class="hint">Показываются только локации с типом "Город"</small>
          </label>
          
          <label class="field">
            <span>Полное название локации</span>
            <input v-model="editProjectForm.full_location_name" type="text" maxlength="255" placeholder="Например: Москва, ул. Тверская, д. 1" />
          </label>

          <label class="field">
            <span>Дата создания</span>
            <input v-model="editProjectForm.created_at" type="datetime-local" />
            <small class="hint">Укажите дату для старых проектов</small>
          </label>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeEditProjectForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Сохранить</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>
  </section>
</template>


<style scoped>
/*
 * ============================================
 * Стили для страницы деталей проекта (project-detail.vue)
 * Цветовая схема: #16181C (фон), #C9A86A (золото), #D0D2D5 (текст)
 * ============================================
 */

/* ============================================
   ОСНОВНЫЕ СТИЛИ
   ============================================ */
* {
  box-sizing: border-box;
}

.suggestion-name {
  font-weight: 500;
}

.suggestion-article {
  color: rgba(208, 210, 213, 0.4);
  font-size: 12px;
  margin-left: 8px;
}

.suggestion-prices {
  margin-left: auto;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.4);
}

.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #16181C;
  color: #D0D2D5;
  min-height: 100vh;
}

/* ============================================
   ТОПБАР
   ============================================ */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(201, 168, 106, 0.2);
}

/* ============================================
   ЗАГОЛОВКИ
   ============================================ */
h1 {
  margin: 0 0 20px;
  font-size: 28px;
  font-weight: 600;
  color: #C9A86A;
}

h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

/* ============================================
   ТЕКСТОВЫЕ УТИЛИТЫ
   ============================================ */
.muted {
  color: rgba(208, 210, 213, 0.6);
  font-size: 14px;
}

/* ============================================
   АЛЕРТЫ / ОШИБКИ
   ============================================ */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.15);
  color: #ef4444;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.alert-error strong {
  color: #ef4444;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

/* ============================================
   ОСНОВНОЙ МАКЕТ - ДВЕ КОЛОНКИ
   ============================================ */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
}

/* ============================================
   КАРТОЧКИ (ОБЩИЙ СТИЛЬ)
   ============================================ */
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header h2 {
  margin: 0;
}

/* ============================================
   ИНФОРМАЦИЯ О ПРОЕКТЕ (СЕТКА)
   ============================================ */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-grid > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid > div span:last-child {
  color: #D0D2D5;
  font-weight: 500;
}

/* ============================================
   ФИНАНСОВЫЙ ОТЧЕТ (ПРАВАЯ КОЛОНКА)
   ============================================ */
.report-card {
  background: rgba(201, 168, 106, 0.06);
  border: 1px solid rgba(201, 168, 106, 0.2);
  border-radius: 12px;
  padding: 20px;
}

.report-card h2 {
  color: #C9A86A;
  margin-bottom: 16px;
}

.report-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(208, 210, 213, 0.06);
  transition: background 0.2s;
}

.report-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.report-item.total {
  background: rgba(201, 168, 106, 0.1);
  border-color: rgba(201, 168, 106, 0.3);
  margin-top: 4px;
}

.report-label {
  font-size: 13px;
  color: rgba(208, 210, 213, 0.7);
  font-weight: 400;
}

.report-value {
  font-size: 14px;
  font-weight: 600;
  color: #D0D2D5;
  font-variant-numeric: tabular-nums;
}

.report-value.positive {
  color: #4ade80;
}

.report-value.negative {
  color: #f87171;
}

.report-value.gold {
  color: #C9A86A;
}

.report-divider {
  border: none;
  border-top: 1px solid rgba(201, 168, 106, 0.15);
  margin: 8px 0;
}

/* ============================================
   ТАБЛИЦЫ
   ============================================ */
.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #D0D2D5;
}

.table th,
.table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(208, 210, 213, 0.06);
  white-space: nowrap;
}

.table th {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 600;
  color: rgba(208, 210, 213, 0.7);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.actions {
  white-space: nowrap;
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #C9A86A;
  color: #16181C;
}

.btn-primary:hover:not(:disabled) {
  background: #d4b87a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 106, 0.3);
}

.btn-ghost {
  background: transparent;
  color: #D0D2D5;
  border-color: rgba(208, 210, 213, 0.2);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 210, 213, 0.3);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-pay {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.15);
}

.btn-pay:hover {
  background: rgba(74, 222, 128, 0.2);
}

.confirm {
  margin-left: 8px;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: #D0D2D5;
}

/* ============================================
   ROW (для полей с кнопкой "+")
   ============================================ */
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row > select {
  flex: 1;
}

/* ============================================
   AUTOCOMPLETE / COMBOBOX
   ============================================ */
.combobox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-wrapper input {
  flex: 1;
  padding-right: 30px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(208, 210, 213, 0.15);
  border-radius: 8px;
  padding: 8px 30px 8px 10px;
  font-size: 14px;
  font-family: inherit;
  color: #D0D2D5;
  transition: border-color 0.2s;
}

.combobox-wrapper input::placeholder {
  color: rgba(208, 210, 213, 0.3);
}

.combobox-wrapper input:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.15);
}

.combobox-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  transition: color 0.2s;
}

.combobox-toggle:hover {
  color: #C9A86A;
}

.combobox-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1e2126;
  border: 1px solid rgba(208, 210, 213, 0.1);
  border-radius: 8px;
  margin: 4px 0 0 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.combobox-suggestions li {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: #D0D2D5;
}

.combobox-suggestions li:hover {
  background: rgba(201, 168, 106, 0.1);
}

.combobox-suggestions li:not(:last-child) {
  border-bottom: 1px solid rgba(208, 210, 213, 0.05);
}

.combobox-suggestions .combobox-create-new {
  color: #C9A86A;
  font-weight: 500;
  border-top: 1px solid rgba(201, 168, 106, 0.15);
}

.combobox-suggestions .combobox-create-new:hover {
  background: rgba(201, 168, 106, 0.1);
}

/* ============================================
   ПОДСКАЗКИ (HINT)
   ============================================ */
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.4);
}

.hint.success {
  color: #4ade80;
}

/* ============================================
   МОДАЛЬНЫЕ ОКНА
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 24, 28, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  background: #1e2126;
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #C9A86A;
}

/* ============================================
   ПОЛЯ ФОРМ
   ============================================ */
.field {
  display: block;
  margin-bottom: 16px;
}

.field span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(208, 210, 213, 0.6);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(208, 210, 213, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: inherit;
  color: #D0D2D5;
  transition: border-color 0.2s;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(208, 210, 213, 0.3);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.15);
}

.field select option {
  background: #1e2126;
  color: #D0D2D5;
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

/* ============================================
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .right-column {
    position: static;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .topbar .btn {
    width: 100%;
    text-align: center;
  }

  .report-grid {
    gap: 6px;
  }

  .report-item {
    padding: 8px 12px;
  }

  .table th,
  .table td {
    padding: 8px 10px;
    font-size: 13px;
  }

  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }

  .card {
    padding: 16px;
  }
}

/* ============================================
   СКРОЛЛБАР (для темной темы)
   ============================================ */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.5);
}

/* ============================================
   ОСНОВНЫЕ СТИЛИ - РАСШИРЕННАЯ ВЕРСИЯ
   ============================================ */
.page {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 24px;
  background: #16181C;
  color: #D0D2D5;
  min-height: 100vh;
  width: 100%;
}

/* ============================================
   ОСНОВНОЙ МАКЕТ - ДВЕ КОЛОНКИ С ГИБКОЙ ШИРИНОЙ
   ============================================ */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  width: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
  min-width: 320px;
  max-width: 360px;
}

/* ============================================
   ТАБЛИЦЫ - С ПРОКРУТКОЙ
   ============================================ */
.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 8px;
  width: 100%;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #D0D2D5;
  min-width: 600px; /* Минимальная ширина для читаемости */
}

.table th,
.table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(208, 210, 213, 0.06);
  white-space: nowrap;
}

/* ============================================
   ИНФОРМАЦИЯ О ПРОЕКТЕ - РАСШИРЕННАЯ СЕТКА
   ============================================ */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px 20px;
}

/* ============================================
   АДАПТИВНОСТЬ ДЛЯ РАЗНЫХ ЭКРАНОВ
   ============================================ */

/* Для экранов 1400px и шире - максимальная ширина */
@media (min-width: 1400px) {
  .page {
    padding: 24px 40px;
  }
  
  .main-layout {
    grid-template-columns: 1fr 380px;
    gap: 32px;
  }
  
  .right-column {
    min-width: 340px;
    max-width: 380px;
  }
}

/* Для экранов 1200-1400px */
@media (max-width: 1400px) and (min-width: 1200px) {
  .page {
    padding: 20px 32px;
  }
  
  .main-layout {
    grid-template-columns: 1fr 340px;
    gap: 24px;
  }
  
  .right-column {
    min-width: 300px;
    max-width: 340px;
  }
}

/* Для экранов 1024-1200px - чуть уже */
@media (max-width: 1200px) {
  .page {
    padding: 16px 24px;
  }
  
  .main-layout {
    grid-template-columns: 1fr 320px;
    gap: 20px;
  }
  
  .right-column {
    min-width: 280px;
    max-width: 320px;
  }
  
  .info-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

/* Для экранов 1024px и меньше - одна колонка */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .right-column {
    position: static;
    min-width: unset;
    max-width: unset;
    width: 100%;
  }

  .report-card {
    margin-top: 0;
  }
  
  .page {
    padding: 16px;
  }
}

/* Для экранов 768px и меньше */
@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  h1 {
    font-size: 22px;
    margin-bottom: 14px;
  }

  h2 {
    font-size: 16px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .topbar .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .card {
    padding: 14px;
    border-radius: 8px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .card-header .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .info-grid > div {
    padding: 4px 0;
  }

  .label {
    font-size: 10px;
  }

  .info-grid > div span:last-child {
    font-size: 13px;
  }

  /* Таблицы */
  .table-wrap {
    border-radius: 6px;
    margin: 0 -4px;
  }

  .table {
    font-size: 12px;
    min-width: 500px;
  }

  .table th,
  .table td {
    padding: 6px 10px;
    font-size: 12px;
  }

  .table th {
    font-size: 10px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .actions .btn {
    font-size: 11px;
    padding: 4px 8px;
  }

  .confirm {
    font-size: 12px;
  }

  /* Отчет */
  .report-card {
    padding: 14px;
  }

  .report-item {
    padding: 8px 10px;
    font-size: 13px;
  }

  .report-label {
    font-size: 12px;
  }

  .report-value {
    font-size: 13px;
  }

  /* Модалки */
  .modal {
    padding: 16px;
    max-width: 95%;
    margin: 8px;
  }
}

/* Для очень маленьких экранов (480px и меньше) */
@media (max-width: 480px) {
  .page {
    padding: 8px;
  }

  h1 {
    font-size: 18px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .info-grid > div {
    flex-direction: row;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid rgba(208, 210, 213, 0.05);
  }

  .info-grid > div:last-child {
    border-bottom: none;
  }

  .table {
    font-size: 11px;
    min-width: 400px;
  }

  .table th,
  .table td {
    padding: 4px 8px;
    font-size: 11px;
  }

  .report-item {
    padding: 6px 10px;
    font-size: 12px;
  }

  .report-label {
    font-size: 11px;
  }

  .report-value {
    font-size: 12px;
  }

  .modal {
    padding: 12px;
  }

  .field {
    margin-bottom: 12px;
  }

  .field input,
  .field select,
  .field textarea {
    padding: 6px 8px;
    font-size: 13px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions .btn {
    width: 100%;
    text-align: center;
  }
}

/* ============================================
   ДОПОЛНИТЕЛЬНО: СКРЫВАЕМ ЛИШНИЕ ЭЛЕМЕНТЫ НА МАЛЕНЬКИХ ЭКРАНАХ
   ============================================ */
@media (max-width: 480px) {
  .hide-on-mobile {
    display: none !important;
  }
  
  .table .hide-on-mobile {
    display: none !important;
  }
}
</style>