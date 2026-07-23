<template>
  <section class="page">
    <div class="topbar">
      <button class="btn btn-ghost" @click="router.push({ name: 'projects' })">← Назад к проектам</button>
      <button 
        id="edit-project-btn"
        class="btn btn-primary" 
        @click="openEditProject"
      >✎ Редактировать проект</button>
    </div>

    <div v-if="error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ error }}</span>
    </div>
    <div v-if="loading && !currentProject" class="state">Загрузка…</div>

    <template v-if="currentProject">
      <h1>{{ currentProject.name }}</h1>

      <!-- Виджет: Информация о проекте -->
      <ProjectInfo 
        :project-id="projectId" 
        @edit="openEditProject"
      />

      <!-- Виджет: Позиции проекта -->
      <ProjectItems
        :project-id="projectId"
        @refresh="refreshAllData"
        @payFactory="openPayFactory"
      />

      <div class="main-layout">
        <div class="left-column">
          <!-- Виджет: Проектные расходы -->
          <ProjectExpenses
            :project-id="projectId"
            @refresh="refreshAllData"
          />

          <!-- Виджет: Оплаты клиентов -->
          <ClientPayments
            :project-id="projectId"
            @refresh="refreshAllData"
          />

          <!-- Виджет: Оплаты фабрикам -->
          <FactoryPayments
            :project-id="projectId"
          />
        </div>

        <!-- Правая колонка - Финансовый отчет -->
        <div class="right-column">
          <ProjectReport :project-id="projectId" />
        </div>
      </div>
    </template>

    <!-- Модалка: Оплата фабрике (из supply) -->
    <FactoryPaymentModal
      v-model="showPayFactory"
      :project-id="projectId"
      :item="payingItem"
      @paid="refreshAllData"
    />

    <!-- Модалка: Редактирование проекта (остается здесь) -->
    <EditProjectModal
      v-model="showEditProjectForm"
      :project-id="projectId"
      :project="currentProject"
      @updated="refreshAllData"
    />

    <!-- Компонент меню онбордингов -->
    <OnboardingMenu>
      <button 
        class="onboarding-start-btn" 
        @click="startTour('project-item')"
      >
        <span class="btn-icon">📦</span>
        Добавить позицию
        <span class="btn-glow"></span>
      </button>

      <button 
        class="onboarding-start-btn" 
        @click="startTour('nomenclature')"
      >
        <span class="btn-icon">🏷️</span>
        Создать товар
        <span class="btn-glow"></span>
      </button>

      <button 
        class="onboarding-start-btn" 
        @click="startTour('factory')"
      >
        <span class="btn-icon">🏭</span>
        Создать фабрику
        <span class="btn-glow"></span>
      </button>

      <button 
        class="onboarding-start-btn" 
        @click="startTour('factory-payment')"
      >
        <span class="btn-icon">💰</span>
        Оплатить фабрике
        <span class="btn-glow"></span>
      </button>

      <button 
        class="onboarding-start-btn" 
        @click="startTour('project-expense')"
      >
        <span class="btn-icon">💸</span>
        Добавить расход
        <span class="btn-glow"></span>
      </button>

      <button 
        class="onboarding-start-btn" 
        @click="startTour('client-payment')"
      >
        <span class="btn-icon">💳</span>
        Оплата клиента
        <span class="btn-glow"></span>
      </button>
    </OnboardingMenu>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'
import { useFinanceStore } from '@/modules/finance/store'

// Виджеты из app
import ProjectInfo from '../widgets/ProjectInfo/index.vue'
import ProjectItems from '../widgets/ProjectItems/index.vue'
import ProjectExpenses from '../widgets/ProjectExpenses/index.vue'
import ProjectReport from '@/modules/finance/widgets/ProjectReport/index.vue' 

// Виджеты из finance
import ClientPayments from '@/modules/finance/widgets/ClientPayments/index.vue'
import EditProjectModal from '../widgets/EditProjectModal/index.vue'
// Виджеты из supply
import FactoryPaymentModal from '@/modules/supply/widgets/FactoryPaymentModal/index.vue'
import FactoryPayments from '@/modules/supply/widgets/FactoryPayments/index.vue'

// Компоненты
import OnboardingMenu from '@/components/OnboardingMenu.vue'

// Онбординги
import { 
  projectItemOnboarding,
  nomenclatureOnboarding,
  factoryOnboarding,
  factoryPaymentOnboarding,
  projectExpenseOnboarding,
  clientPaymentOnboarding,
} from '@/onboardings'

// --- Router & Stores ---
const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const financeStore = useFinanceStore()

// --- Store refs ---
const { 
  currentProject, 
  loading, 
  error,
} = storeToRefs(store)

const { report: financeReport } = storeToRefs(financeStore)

// --- Computed ---
const projectId = computed(() => Number(route.params.id))

const projectReport = computed(() => {
  if (!financeReport.value) return null
  
  const report = financeReport.value
  
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
  }
})

// --- Modals state ---
const showPayFactory = ref(false)
const payingItem = ref(null)
const showEditProjectForm = ref(false)

// --- Edit project form ---
const editFormRef = ref(null)
const editProjectForm = reactive({
  name: '',
  client: '',
  status: '',
  tech_manager: '',
  location: '',
  full_location_name: '',
  created_at: '',
})

const editLocationSearch = ref('')
const editShowLocationSuggestions = ref(false)
const editSelectedLocation = ref(null)

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

function onEditLocationInput() {
  if (editSelectedLocation.value && editLocationSearch.value !== editSelectedLocation.value.name) {
    editSelectedLocation.value = null
    editProjectForm.location = ''
  }
  editShowLocationSuggestions.value = true
}

function onEditLocationBlur() {
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

function toggleEditLocationSuggestions() {
  editShowLocationSuggestions.value = !editShowLocationSuggestions.value
  if (editShowLocationSuggestions.value && !editLocationSearch.value) {
    editLocationSearch.value = ''
  }
}

function editSelectLocation(location) {
  editSelectedLocation.value = location
  editLocationSearch.value = location.name
  editProjectForm.location = location.id
  editShowLocationSuggestions.value = false
}

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

// --- Pay factory ---
function openPayFactory(item) {
  payingItem.value = item
  showPayFactory.value = true
}

// --- Helpers ---
function formatCurrency(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : String(v)
}

function formatPercent(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) + '%' : String(v)
}

function getProfitClass(value) {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

// --- Refresh ---
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

// --- Onboarding ---
function startTour(type) {
  const tours = {
    'project-item': projectItemOnboarding,
    nomenclature: nomenclatureOnboarding,
    factory: factoryOnboarding,
    'factory-payment': factoryPaymentOnboarding,
    'project-expense': projectExpenseOnboarding,
    'client-payment': clientPaymentOnboarding
  }
  
  const tour = tours[type]
  if (tour) {
    if (tour.isActive()) {
      tour.destroy()
    }
    setTimeout(() => {
      tour.drive()
    }, 300)
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
</script>

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

.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #16181C;
  color: #D0D2D5;
  min-height: 100vh;
  width: 100%;
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

.state.muted {
  color: rgba(208, 210, 213, 0.4);
}

/* ============================================
   ОСНОВНОЙ МАКЕТ - ДВЕ КОЛОНКИ
   ============================================ */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
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

/* ============================================
   МОДАЛЬНЫЕ ОКНА (для EditProject)
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.combobox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-wrapper input {
  flex: 1;
  padding-right: 30px;
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
   ОНБОРДИНГ МЕНЮ
   ============================================ */
.onboarding-start-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(208, 210, 213, 0.15);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #D0D2D5;
  transition: all 0.2s;
}

.onboarding-start-btn:hover {
  background: rgba(201, 168, 106, 0.1);
  border-color: #C9A86A;
}

.btn-icon {
  font-size: 18px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
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
}

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
  
  .page {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  h1 {
    font-size: 22px;
    margin-bottom: 14px;
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
  }

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

  .modal {
    padding: 16px;
    max-width: 95%;
    margin: 8px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 8px;
  }

  h1 {
    font-size: 18px;
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
</style>