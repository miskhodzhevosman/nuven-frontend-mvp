<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'
import { nextTick } from 'vue'

// Импорт компонентов
import ProjectFilters from '../components/ProjectFilters.vue'
import ProjectTable from '../components/ProjectTable.vue'
import CreateProjectModal from '../components/CreateProjectModal.vue'
import CreateClientModal from '../components/CreateClientModal.vue'
import CreateManagerModal from '../components/CreateManagerModal.vue'
import HistoryModal from '../components/HistoryModal.vue'
import OnboardingMenu from '@/components/OnboardingMenu.vue'

// Импорт онбординга
import { onboarding as projectCreateOnboarding } from '@/onboardings/ProjectsCreateOnboarding'
import { nextOnboardingStep } from '@/onboardings/ProjectsCreateOnboarding'

const router = useRouter()
const store = useProjectsStore()
const { projects, loading, error, count, statuses, clients, managers, locations } = storeToRefs(store)

// Фильтр по статусу
const selectedStatusId = ref(null)

// История изменений
const showHistoryModal = ref(false)
const historyProject = ref(null)
const historyData = ref([])
const historyLoading = ref(false)

// Modal state
const showCreateProjectForm = ref(false)
const showCreateClientForm = ref(false)
const showCreateManagerForm = ref(false)

// Computed - фильтруем проекты по статусу и сортируем
const filteredProjects = computed(() => {
  let result = [...projects.value]
  
  if (selectedStatusId.value) {
    result = result.filter(p => p.status === Number(selectedStatusId.value))
  }
  
  result.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at)
    const dateB = new Date(b.updated_at || b.created_at)
    return dateB - dateA
  })
  
  return result
})

// Computed - статусы с количеством проектов
const statusesWithCount = computed(() => {
  if (!statuses.value) return []
  return statuses.value.map(status => ({
    ...status,
    count: projects.value.filter(p => p.status === status.id).length
  }))
})

// Computed - количество активных фильтров
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedStatusId.value) count++
  return count
})

// Онбординг
function startTour() {
  projectCreateOnboarding.drive()
}

// Фильтры
function selectStatus(statusId) {
  if (selectedStatusId.value === statusId) {
    selectedStatusId.value = null
  } else {
    selectedStatusId.value = statusId
  }
}

function clearFilters() {
  selectedStatusId.value = null
}

// Создание проекта
async function openCreateProject() {
  showCreateProjectForm.value = true
  await nextTick()
  nextOnboardingStep()
}

function closeCreateProjectForm() {
  showCreateProjectForm.value = false
}

async function handleProjectCreated() {
  closeCreateProjectForm()
  await store.fetchProjects()
}

// Создание клиента
function openCreateClient() {
  showCreateClientForm.value = true
}

function closeCreateClientForm() {
  showCreateClientForm.value = false
}

async function handleClientCreated() {
  closeCreateClientForm()
  await store.fetchClients()
}

// Создание менеджера
function openCreateManager() {
  showCreateManagerForm.value = true
}

function closeCreateManagerForm() {
  showCreateManagerForm.value = false
}

async function handleManagerCreated() {
  closeCreateManagerForm()
  await store.fetchManagers()
}

// История
async function openHistory(project) {
  historyProject.value = project
  historyLoading.value = true
  historyData.value = []
  showHistoryModal.value = true
  
  try {
    const data = await store.fetchProjectHistory(project.id)
    historyData.value = data || []
  } catch (e) {
    console.error('Failed to fetch history:', e)
    error.value = 'Ошибка загрузки истории'
  } finally {
    historyLoading.value = false
  }
}

function closeHistory() {
  showHistoryModal.value = false
  historyProject.value = null
  historyData.value = []
}

// Навигация
function openProject(id) {
  router.push({ name: 'project-detail', params: { id } })
}

// Инициализация
onMounted(() => {
  store.fetchProjects().catch(() => {})
  store.fetchStatuses().catch(() => {})
  store.fetchClients().catch(() => {})
  store.fetchManagers().catch(() => {})
  store.fetchLocations().catch(() => {})
})
</script>

<template>
  <section class="page">
    <!-- Хедер -->
    <header class="page-header">
      <div>
        <h1>Проекты</h1>
        <p class="muted">Всего: {{ count }}</p>
      </div>
      <button class="btn btn-primary" id="add-project-btn" @click="openCreateProject">
        + Создать проект
      </button>
    </header>

    <!-- Ошибка -->
    <div v-if="error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ error }}</span>
    </div>

    <!-- Фильтры -->
    <ProjectFilters
      :statuses="statusesWithCount"
      :selected-status-id="selectedStatusId"
      :active-filter-count="activeFilterCount"
      @select-status="selectStatus"
      @clear-filters="clearFilters"
    />

    <!-- Состояния загрузки и пустоты -->
    <div v-if="loading && !projects.length" class="state">Загрузка…</div>
    <div v-else-if="!filteredProjects.length && !error" class="state muted">
      {{ selectedStatusId ? 'Нет проектов с выбранным статусом.' : 'Нет проектов.' }}
    </div>

    <!-- Таблица проектов -->
    <ProjectTable
      v-else
      :projects="filteredProjects"
      @open="openProject"
      @history="openHistory"
    />

    <!-- Модалки -->
    <CreateProjectModal
      v-if="showCreateProjectForm"
      :statuses="statuses"
      :loading="loading"
      :error="error"
      @close="closeCreateProjectForm"
      @created="handleProjectCreated"
      @open-client="openCreateClient"
      @open-manager="openCreateManager"
    />

    <CreateClientModal
      v-if="showCreateClientForm"
      :loading="loading"
      :error="error"
      @close="closeCreateClientForm"
      @created="handleClientCreated"
    />

    <CreateManagerModal
      v-if="showCreateManagerForm"
      :loading="loading"
      :error="error"
      @close="closeCreateManagerForm"
      @created="handleManagerCreated"
    />

    <HistoryModal
      v-if="showHistoryModal"
      :project="historyProject"
      :history-data="historyData"
      :loading="historyLoading"
      :clients="clients"
      :statuses="statuses"
      :managers="managers"
      :locations="locations"
      @close="closeHistory"
    />

    <!-- Онбординг -->
    <OnboardingMenu>
      <button class="onboarding-start-btn" @click="startTour">
        <span class="btn-icon">📁</span>
        Создать проект
        <span class="btn-glow"></span>
      </button>
    </OnboardingMenu>
  </section>
</template>

<style scoped>
/* ============================================
   ОСНОВНЫЕ СТИЛИ СТРАНИЦЫ
   ============================================ */
.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #F8F9FA;
  color: #1A1A1A;
  min-height: 100vh;
}

/* ============================================
   ЗАГОЛОВОК СТРАНИЦЫ
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(44, 62, 80, 0.12);
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 600;
  color: #2C3E50;
}

.page-header .muted {
  color: rgba(26, 26, 26, 0.5);
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
  background: rgba(220, 38, 38, 0.08);
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.15);
}

.alert-error strong {
  color: #DC2626;
}

/* ============================================
   СОСТОЯНИЯ
   ============================================ */
.state {
  padding: 40px;
  text-align: center;
  color: rgba(26, 26, 26, 0.35);
  font-size: 16px;
}

.state.muted {
  color: rgba(26, 26, 26, 0.35);
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
  transition: all 0.2s ease;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2C3E50;
  color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
  background: #34495E;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.25);
}

.btn-ghost {
  background: transparent;
  color: #1A1A1A;
  border-color: rgba(0, 0, 0, 0.12);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* ============================================
   ОНБОРДИНГ КНОПКА
   ============================================ */
.onboarding-start-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: #FFFFFF;
  color: #2C3E50;
  border: 2px solid #2C3E50;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-icon {
  font-size: 18px;
}

/* Свечение */
.btn-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(44, 62, 80, 0.1), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.onboarding-start-btn:hover {
  background: #2C3E50;
  color: #FFFFFF;
  box-shadow: 
    0 0 20px rgba(44, 62, 80, 0.2),
    inset 0 0 20px rgba(44, 62, 80, 0.05);
  transform: translateY(-2px);
}

.onboarding-start-btn:hover .btn-glow {
  opacity: 1;
}

.onboarding-start-btn:active {
  transform: scale(0.95);
}

.onboarding-start-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 8px;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    #2C3E50 20%,
    #E67E22 40%,
    #E74C3C 60%,
    #E67E22 80%,
    #2C3E50 100%
  );
  background-size: 300% 300%;
  animation: rotateBorder 4s linear infinite;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.onboarding-start-btn:hover::before {
  opacity: 0.6;
}

@keyframes rotateBorder {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .page-header .btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 12px;
  }
}
</style>