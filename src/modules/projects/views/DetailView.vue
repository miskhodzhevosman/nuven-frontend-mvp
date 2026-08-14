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

  <!-- Табы -->
  <div class="project-tabs">
    <button
      class="project-tab"
      :class="{ active: activeTab === 'overview' }"
      @click="activeTab = 'overview'"
    >
      Обзор
    </button>

    <button
      class="project-tab"
      :class="{ active: activeTab === 'files' }"
      @click="activeTab = 'files'"
    >
      Файлы
    </button>
  </div>

  <!-- ===================== -->
  <!-- ОБЗОР -->
  <!-- ===================== -->

  <template v-if="activeTab === 'overview'">

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

        <!-- Проектные расходы -->
        <ProjectExpenses
          :project-id="projectId"
          @refresh="refreshAllData"
        />

        <!-- Оплаты клиентов -->
        <ClientPayments
          :project-id="projectId"
          @refresh="refreshAllData"
        />

        <!-- Оплаты фабрикам -->
        <FactoryPayments
          ref="factoryPaymentsRef"
          :project-id="projectId"
          @refresh="refreshAllData"
        />

      </div>

      <!-- Финансовый отчет -->
      <div class="right-column">
        <ProjectReport
          :project-id="projectId"
        />
      </div>

    </div>

  </template>

  <!-- ===================== -->
  <!-- ФАЙЛЫ -->
  <!-- ===================== -->

  <template v-else-if="activeTab === 'files'">

    <ProjectFiles
      :project-id="projectId"
    />

  </template>

</template>

    <!-- Модалка: Оплата фабрике (из supply) -->
    <FactoryPaymentModal
      v-model="showPayFactory"
      :project-id="projectId"
      :item="payingItem"
      @paid="onFactoryPaymentPaid"
    />

    <!-- Модалка: Редактирование проекта -->
    <EditProjectModal
      v-if="showEditProjectForm"
      v-model="showEditProjectForm"
      :project-id="projectId"
      :project="currentProject"
      @updated="onProjectUpdated"
    />

    <!-- Модалка: Создание товара -->
    <NomenclatureModal
      v-model="showCreateNomenclature"
      @created="onNomenclatureCreated"
      @factory-created="onFactoryCreated"
    />

    <!-- Модалка: Создание фабрики -->
    <FactoryFormModal
      v-model="showCreateFactory"
      @created="onFactoryCreated"
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
import { ref, reactive, computed, onMounted, watch } from 'vue' // <-- ДОБАВИТЬ watch
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'
import { useFinanceStore } from '@/modules/finance/store'

// Виджеты из app
import ProjectInfo from '../widgets/ProjectInfo/index.vue'
import ProjectItems from '../widgets/ProjectItems/index.vue'

import ProjectReport from '@/modules/finance/widgets/ProjectReport/index.vue' 

// Виджеты из finance
import ClientPayments from '@/modules/finance/widgets/ClientPayments/index.vue'
import EditProjectModal from '../widgets/EditProjectModal/index.vue'

// Виджеты из supply
import FactoryPaymentModal from '@/modules/supply/widgets/FactoryPaymentModal/index.vue'
import FactoryPayments from '@/modules/supply/widgets/FactoryPayments/index.vue'
import ProjectExpenses from '@/modules/projects/widgets/ProjectExpenses/index.vue'

// Модалки создания
import NomenclatureModal from '@/modules/supply/widgets/NomenclatureFormModal/index.vue'
import FactoryFormModal from '@/modules/supply/widgets/FactoryFormModal/index.vue'

import ProjectFiles from '../widgets/ProjectFiles/index.vue'

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

const activeTab = ref('overview')

// --- Store refs ---
const { 
  currentProject, 
  loading, 
  error,
} = storeToRefs(store)

const { report: financeReport } = storeToRefs(financeStore)

// --- Refs для компонентов ---
const factoryPaymentsRef = ref(null)

// --- Computed ---
const projectId = computed(() => Number(route.params.id))

// --- Modals state ---
const showPayFactory = ref(false)
const payingItem = ref(null)
const showEditProjectForm = ref(false)
const showCreateNomenclature = ref(false)
const showCreateFactory = ref(false)

// --- Edit project functions ---
function openEditProject() {
  if (!currentProject.value) {
    console.warn('Project not loaded yet')
    return
  }
  
  console.log('Opening edit modal for project:', currentProject.value)
  showEditProjectForm.value = true
}

async function onProjectUpdated() {
  console.log('Project updated, refreshing data...')
  showEditProjectForm.value = false
  
  // Обновляем данные проекта
  await store.fetchProject(projectId.value)
  await refreshAllData()
}

// --- Pay factory ---
function openPayFactory(item) {
  payingItem.value = item
  showPayFactory.value = true
}

// --- Обработчик успешной оплаты фабрике ---
async function onFactoryPaymentPaid() {
  // Закрываем модалку
  showPayFactory.value = false
  
  // Обновляем все данные
  await refreshAllData()
  
  // Принудительно обновляем таблицу оплат фабрикам
  if (factoryPaymentsRef.value && factoryPaymentsRef.value.refresh) {
    await factoryPaymentsRef.value.refresh()
  }
  
  // Дополнительно обновляем factoryPayments в store
  await store.fetchFactoryPayments(projectId.value)
}

// --- Create nomenclature & factory ---
async function onNomenclatureCreated() {
  await refreshAllData()
  await store.fetchNomenclatures()
}

async function onFactoryCreated() {
  await refreshAllData()
  await store.fetchFactories()
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
      // Открываем соответствующие модалки для создания
      if (type === 'nomenclature') {
        showCreateNomenclature.value = true
      } else if (type === 'factory') {
        showCreateFactory.value = true
      } else {
        tour.drive()
      }
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

// Следим за изменением projectId (например, при переходе между проектами)
watch(() => projectId.value, () => {
  loadAll()
})

onMounted(loadAll)
</script>

<style scoped>
/* ============================================
   ОСНОВНЫЕ СТИЛИ СТРАНИЦЫ ПРОЕКТА
   Белая схема, полная ширина
   ============================================ */

.page {
  padding: 20px 24px 32px;
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  background: #F8F9FA;
}

/* ============================================
   TOPBAR - Верхняя панель с кнопками
   ============================================ */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 14px 24px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid rgba(44, 62, 80, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.topbar .btn {
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-ghost {
  background: transparent;
  color: #5B6778;
}

.btn-ghost:hover {
  background: #F0F2F5;
  color: #1A1A1A;
}

.btn-primary {
  background: #2C3E50;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.12);
}

.btn-primary:hover {
  background: #1a2a3a;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.2);
}

/* ============================================
   ALERTS & STATES
   ============================================ */
.alert {
  padding: 14px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.alert-error {
  background: #FEF2F2;
  border-left: 4px solid #DC2626;
  color: #991B1B;
}

.alert-error strong {
  color: #7F1D1D;
}

.state {
  text-align: center;
  padding: 60px 20px;
  color: #5B6778;
  font-size: 16px;
}

/* ============================================
   ЗАГОЛОВОК ПРОЕКТА
   ============================================ */
h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 6px 0;
  letter-spacing: -0.3px;
}

/* ============================================
   ТАБЫ
   ============================================ */
.project-tabs {
  display: flex;
  gap: 4px;
  margin: 20px 0 28px 0;
  padding: 4px;
  width: fit-content;
  background: #F1F3F6;
  border-radius: 10px;
  border: 1px solid rgba(44, 62, 80, 0.04);
}

.project-tab {
  border: none;
  background: transparent;
  padding: 9px 22px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #5B6778;
  transition: all 0.2s ease;
}

.project-tab:hover {
  color: #1A1A1A;
  background: rgba(255, 255, 255, 0.5);
}

.project-tab.active {
  background: #FFFFFF;
  color: #2C3E50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

/* ============================================
   ОСНОВНАЯ СЕТКА (2 колонки) - полная ширина
   ============================================ */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  margin-top: 24px;
  align-items: start;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0; /* Предотвращает переполнение */
}

.right-column {
  position: sticky;
  top: 24px;
}

/* ============================================
   ВИДЖЕТЫ / КАРТОЧКИ
   ============================================ */
.left-column > *,
.right-column > * {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid rgba(44, 62, 80, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.2s ease;
  width: 100%;
}

.left-column > *:hover,
.right-column > *:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* Специальный стиль для ProjectItems (без отступа в карточке) */
:deep(.ProjectItems) {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0 !important;
  border: 1px solid rgba(44, 62, 80, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  width: 100%;
}

/* Стиль для вложенных компонентов внутри виджетов */
:deep(.ProjectInfo),
:deep(.ProjectItems),
:deep(.ProjectExpenses),
:deep(.ClientPayments),
:deep(.FactoryPayments),
:deep(.ProjectReport),
:deep(.ProjectFiles) {
  width: 100%;
}

/* ============================================
   КНОПКИ ОНБОРДИНГА
   ============================================ */
.onboarding-start-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #2C3E50 0%, #1a2a3a 100%);
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.2);
}

.onboarding-start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(44, 62, 80, 0.3);
}

.onboarding-start-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 18px;
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.onboarding-start-btn:hover .btn-glow {
  opacity: 1;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */

/* Планшеты и маленькие ноутбуки */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .right-column {
    position: static;
  }
}

/* Мобильные устройства */
@media (max-width: 768px) {
  .page {
    padding: 16px 16px 24px;
  }
  
  .topbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 16px;
    border-radius: 10px;
  }
  
  .topbar .btn {
    justify-content: center;
    padding: 10px 16px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  .project-tabs {
    width: 100%;
    justify-content: stretch;
    gap: 2px;
  }
  
  .project-tab {
    flex: 1;
    text-align: center;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .left-column > *,
  .right-column > * {
    padding: 16px 18px;
    border-radius: 10px;
  }
  
  .main-layout {
    gap: 16px;
    margin-top: 16px;
  }
  
  .left-column {
    gap: 16px;
  }
  
  .onboarding-start-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }
}

/* Маленькие телефоны */
@media (max-width: 480px) {
  .page {
    padding: 12px 12px 20px;
  }
  
  h1 {
    font-size: 20px;
  }
  
  .topbar {
    padding: 10px 12px;
    border-radius: 8px;
  }
  
  .topbar .btn {
    font-size: 13px;
    padding: 8px 14px;
  }
  
  .project-tab {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .left-column > *,
  .right-column > * {
    padding: 12px 14px;
    border-radius: 8px;
  }
  
  .btn-icon {
    font-size: 16px;
  }
}

/* ============================================
   ДОПОЛНИТЕЛЬНО: АНИМАЦИИ
   ============================================ */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.left-column > *,
.right-column > * {
  animation: fadeIn 0.3s ease forwards;
}

/* Задержка для карточек (эффект каскада) */
.left-column > *:nth-child(1) { animation-delay: 0.05s; }
.left-column > *:nth-child(2) { animation-delay: 0.1s; }
.left-column > *:nth-child(3) { animation-delay: 0.15s; }
.right-column > *:nth-child(1) { animation-delay: 0.1s; }

/* ============================================
   КАСТОМНЫЙ СКРОЛЛ ДЛЯ КОНТЕНТА
   ============================================ */
.page::-webkit-scrollbar {
  width: 6px;
}

.page::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
}

.page::-webkit-scrollbar-thumb {
  background: rgba(44, 62, 80, 0.15);
  border-radius: 3px;
}

.page::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 62, 80, 0.25);
}
</style>