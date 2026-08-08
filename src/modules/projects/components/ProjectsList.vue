<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

import ProjectFilters from './ProjectFilters.vue'
import ProjectTable from './ProjectTable.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import CreateClientModal from './CreateClientModal.vue'
import CreateManagerModal from './CreateManagerModal.vue'
import HistoryModal from './HistoryModal.vue'
import OnboardingMenu from '@/components/OnboardingMenu.vue'
import { onboarding as projectCreateOnboarding } from '@/onboardings/ProjectsCreateOnboarding'
import { nextOnboardingStep } from '@/onboardings/ProjectsCreateOnboarding'
import { goToOnboardingStep } from '@/onboardings/ProjectsCreateOnboarding'
import { nextTick } from 'vue'

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

function startTour() {
  projectCreateOnboarding.drive()
}

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

function openCreateProject() {
  showCreateProjectForm.value = true
  nextTick()
  nextOnboardingStep()
}

function closeCreateProjectForm() {
  showCreateProjectForm.value = false
}

function openCreateClient() {
  showCreateClientForm.value = true
}

function closeCreateClientForm() {
  showCreateClientForm.value = false
}

function openCreateManager() {
  showCreateManagerForm.value = true
}

function closeCreateManagerForm() {
  showCreateManagerForm.value = false
}

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

function openProject(id) {
  router.push({ name: 'project-detail', params: { id } })
}

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
    <header class="page-header">
      <div>
        <h1>Проекты</h1>
        <p class="muted">Всего: {{ count }}</p>
      </div>
      <button class="btn btn-primary" id="add-project-btn" @click="openCreateProject">+ Создать проект</button>
    </header>

    <div v-if="error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ error }}</span>
    </div>

    <ProjectFilters
      :statuses="statusesWithCount"
      :selected-status-id="selectedStatusId"
      :active-filter-count="activeFilterCount"
      @select-status="selectStatus"
      @clear-filters="clearFilters"
    />

    <div v-if="loading && !projects.length" class="state">Загрузка…</div>
    <div v-else-if="!filteredProjects.length && !error" class="state muted">
      {{ selectedStatusId ? 'Нет проектов с выбранным статусом.' : 'Нет проектов.' }}
    </div>

    <ProjectTable
      v-else
      :projects="filteredProjects"
      @open="openProject"
      @history="openHistory"
    />

    <CreateProjectModal
      v-if="showCreateProjectForm"
      :statuses="statuses"
      :loading="loading"
      :error="error"
      @close="closeCreateProjectForm"
      @created="() => { closeCreateProjectForm(); store.fetchProjects(); }"
      @open-client="openCreateClient"
      @open-manager="openCreateManager"
    />

    <CreateClientModal
      v-if="showCreateClientForm"
      :loading="loading"
      :error="error"
      @close="closeCreateClientForm"
      @created="(client) => { closeCreateClientForm(); store.fetchClients(); }"
    />

    <CreateManagerModal
      v-if="showCreateManagerForm"
      :loading="loading"
      :error="error"
      @close="closeCreateManagerForm"
      @created="(manager) => { closeCreateManagerForm(); store.fetchManagers(); }"
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

    <OnboardingMenu>
      <button class="onboarding-start-btn" @click="startTour">
        <span class="btn-icon">📁</span>
        Создать проект
        <span class="btn-glow"></span>
      </button>
    </OnboardingMenu>
  </section>
</template>