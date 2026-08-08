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
            ref="factoryPaymentsRef"
            :project-id="projectId"
            @refresh="refreshAllData"
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
/* ... ваши стили ... */
</style>