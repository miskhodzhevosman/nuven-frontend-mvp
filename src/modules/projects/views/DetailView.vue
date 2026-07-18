<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const { currentProject, projectItems, clientPayments, factoryPayments, projectExpenses, loading, error, statuses, clients, managers, locations } = storeToRefs(store)

const projectId = computed(() => Number(route.params.id))

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
const showEditProjectForm = ref(false) // Modal for editing project

// --- Forms ---
const emptyItemForm = () => ({
  nomenclature: '',
  quantity: '1',
  fixed_cost_price: '',
  fixed_sale_price: '',
})
const itemForm = reactive(emptyItemForm())
const itemFormRef = ref(null)

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
})
const editFormRef = ref(null)

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
  if (!clients.value) return []
  return clients.value.filter(c => c.type === 'CLIENT')
})

const editFilteredLocations = computed(() => {
  if (!locations.value) return []
  return locations.value.filter(l => l.type === 'CITY')
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

// --- Project items ---
function openCreateItem() {
  editingItemId.value = null
  Object.assign(itemForm, emptyItemForm())
  showItemForm.value = true
}
function openEditItem(item) {
  editingItemId.value = item.id
  itemForm.nomenclature = item.nomenclature ?? ''
  itemForm.quantity = item.quantity ?? '1'
  itemForm.fixed_cost_price = item.fixed_cost_price ?? ''
  itemForm.fixed_sale_price = item.fixed_sale_price ?? ''
  showItemForm.value = true
}
function closeItemForm() { showItemForm.value = false; editingItemId.value = null }

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
  } catch {}
}

async function deleteItem(id) {
  try { await store.deleteProjectItem(id) } finally { confirmDeleteItemId.value = null }
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
    itemForm.nomenclature = created.id
    closeNomenclatureForm()
  } catch {}
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
    nomenclatureForm.factory = created.id
    closeFactoryForm()
  } catch {}
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
  } catch {}
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
  } catch {}
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
  } catch {}
}

// --- Edit project ---
function openEditProject() {
  if (!currentProject.value) return
  
  // Заполняем форму данными текущего проекта
  editProjectForm.name = currentProject.value.name || ''
  editProjectForm.client = currentProject.value.client || ''
  editProjectForm.status = currentProject.value.status || ''
  editProjectForm.tech_manager = currentProject.value.tech_manager || ''
  editProjectForm.location = currentProject.value.location || ''
  editProjectForm.full_location_name = currentProject.value.full_location_name || ''
  
  // Устанавливаем локацию для autocomplete
  if (currentProject.value.location) {
    const loc = locations.value.find(l => l.id === currentProject.value.location)
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
  }
  
  try {
    await store.updateProject(projectId.value, payload)
    closeEditProjectForm()
    // Перезагружаем проект
    await store.fetchProject(projectId.value)
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
    await Promise.all([
      store.fetchProjectItems(projectId.value),
      store.fetchClientPayments(projectId.value),
      store.fetchFactoryPayments(projectId.value),
      store.fetchProjectExpenses(projectId.value),
    ])
  } catch {}
}

onMounted(loadAll)
watch(projectId, loadAll)
</script>

<template>
  <section class="page">
    <div class="topbar">
      <button class="btn btn-ghost" @click="router.push({ name: 'projects-list' })">← Назад к проектам</button>
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
    </template>

    <!-- Модалка: позиция проекта -->
    <div v-if="showItemForm" class="modal-backdrop" @click.self="closeItemForm">
      <div class="modal">
        <h2>{{ editingItemId ? 'Редактировать позицию' : 'Новая позиция' }}</h2>
        <form ref="itemFormRef" @submit.prevent="submitItem">
          <label class="field">
            <span>Товар *</span>
            <div class="row">
              <select v-model="itemForm.nomenclature" required>
                <option value="" disabled>— выберите —</option>
                <option v-for="n in store.nomenclatures" :key="n.id" :value="n.id">
                  {{ n.name }}{{ n.article ? ` (${n.article})` : '' }}
                </option>
              </select>
              <button type="button" class="btn btn-ghost" @click="openCreateNomenclature">+ Новый товар</button>
            </div>
          </label>
          <label class="field"><span>Количество *</span>
            <input v-model="itemForm.quantity" type="number" step="0.01" min="0" required />
          </label>
          <label class="field"><span>Фикс. себестоимость</span>
            <input v-model="itemForm.fixed_cost_price" type="number" step="0.01" />
          </label>
          <label class="field"><span>Фикс. цена продажи</span>
            <input v-model="itemForm.fixed_sale_price" type="number" step="0.01" />
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
              <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>
          
          <label class="field">
            <span>Технический менеджер</span>
            <select v-model="editProjectForm.tech_manager">
              <option value="">— не выбран —</option>
              <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.full_name || m.name }}</option>
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
.page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #1f2937; }
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
h1 { margin: 0 0 20px; font-size: 24px; font-weight: 600; }
.muted { color: #6b7280; font-size: 14px; }
.alert { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.state { padding: 24px; text-align: center; }

.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.card h2 { margin: 0 0 12px; font-size: 18px; font-weight: 600; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.card-header h2 { margin: 0; }

.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.info-grid > div { display: flex; flex-direction: column; gap: 2px; }
.label { font-size: 12px; color: #6b7280; font-weight: 500; }

.table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.table th { background: #f8fafc; font-weight: 600; color: #475569; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.actions { white-space: nowrap; }

.btn { border: 1px solid transparent; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-ghost { background: transparent; color: #334155; border-color: #cbd5e1; }
.btn-ghost:hover { background: #f1f5f9; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-pay { background: #059669; color: #fff; }
.btn-pay:hover { background: #047857; }
.confirm { margin-left: 8px; display: inline-flex; gap: 4px; align-items: center; }

.row { display: flex; gap: 8px; align-items: center; }
.row > select { flex: 1; }

/* Combobox styles */
.combobox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-wrapper input {
  flex: 1;
  padding-right: 30px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 30px 8px 10px;
  font-size: 14px;
  font-family: inherit;
}

.combobox-wrapper input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.combobox-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  color: #6b7280;
}

.combobox-toggle:hover {
  color: #374151;
}

.combobox-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.combobox-suggestions li {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
}

.combobox-suggestions li:hover {
  background: #f3f4f6;
}

.combobox-suggestions li:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

.hint { display: block; margin-top: 4px; font-size: 12px; color: #6b7280; }
.hint.success { color: #28a745; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
.modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); max-height: 90vh; overflow-y: auto; }
.modal h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
.field { display: block; margin-bottom: 14px; }
.field span { display: block; margin-bottom: 4px; font-size: 13px; color: #374151; font-weight: 500; }
.field input, .field select, .field textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; }
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

@media (max-width: 640px) { .page { padding: 16px; } }
</style>