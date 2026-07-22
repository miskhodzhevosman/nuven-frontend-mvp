<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const router = useRouter()
const store = useProjectsStore()
const { projects, loading, error, count, statuses, clients, managers, locations } = storeToRefs(store)

import OnboardingMenu from '@/components/OnboardingMenu.vue'

  import { onboarding as projectCreateOnboarding } from '@/onboardings/ProjectsCreateOnboarding'
import { nextOnboardingStep } from '@/onboardings/ProjectsCreateOnboarding'
import { goToOnboardingStep } from '@/onboardings/ProjectsCreateOnboarding'

import { nextTick } from 'vue'

function startTour() {
    projectCreateOnboarding.drive();
}

// Фильтр по статусу
const selectedStatusId = ref(null)

// История изменений
const showHistoryModal = ref(false)
const historyProject = ref(null)
const historyData = ref([])
const historyLoading = ref(false)

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

// Computed - фильтруем клиентов только с типом CLIENT
const filteredClients = computed(() => {
  if (!clients.value) return []
  return clients.value.filter(c => c.type === 'CLIENT')
})

// Modal state
const showCreateProjectForm = ref(false)
const createFormRef = ref(null)

// Sub-modals state
const showCreateClientForm = ref(false)
const showCreateManagerForm = ref(false)

// Form data
const createForm = reactive({
  name: '',
  client: '',
  status: '',
  tech_manager: '',
  location: '',
  full_location_name: '',
  created_at: '',
})

// Client form
const clientForm = reactive({
  name: '',
  contacts: '',
  address: '',
})

// Manager form
const managerForm = reactive({
  full_name: '',
  contacts: '',
})

// Location autocomplete state
const locationSearch = ref('')
const showLocationSuggestions = ref(false)
const selectedLocation = ref(null)
const locationSuggestions = ref([])
const isLocationLoading = ref(false)

// Client autocomplete state
const clientSearch = ref('')
const showClientSuggestions = ref(false)
const selectedClient = ref(null)
const clientSuggestions = ref([])
const isClientLoading = ref(false)

// Manager autocomplete state
const managerSearch = ref('')
const showManagerSuggestions = ref(false)
const selectedManager = ref(null)
const managerSuggestions = ref([])
const isManagerLoading = ref(false)

// Reset forms
function resetForm() {
  createForm.name = ''
  createForm.client = ''
  createForm.status = ''
  createForm.tech_manager = ''
  createForm.location = ''
  createForm.full_location_name = ''
  createForm.created_at = ''
  
  // Сброс локации
  locationSearch.value = ''
  selectedLocation.value = null
  showLocationSuggestions.value = false
  locationSuggestions.value = []
  isLocationLoading.value = false
  
  // Сброс клиента
  clientSearch.value = ''
  selectedClient.value = null
  clientSuggestions.value = []
  showClientSuggestions.value = false
  isClientLoading.value = false
  
  // Сброс менеджера
  managerSearch.value = ''
  selectedManager.value = null
  managerSuggestions.value = []
  showManagerSuggestions.value = false
  isManagerLoading.value = false
}

function resetClientForm() {
  clientForm.name = ''
  clientForm.contacts = ''
  clientForm.address = ''
}

function resetManagerForm() {
  managerForm.full_name = ''
  managerForm.contacts = ''
}

// Location autocomplete methods
const onLocationInput = async () => {
  selectedLocation.value = null
  createForm.location = ''
  
  if (locationSearch.value.length < 2) {
    locationSuggestions.value = []
    showLocationSuggestions.value = false
    return
  }
  
  try {
    isLocationLoading.value = true
    const results = await store.autocompleteLocations(locationSearch.value)
    locationSuggestions.value = results || []
    showLocationSuggestions.value = results.length > 0
  } catch (e) {
    console.error('Failed to autocomplete locations:', e)
    locationSuggestions.value = []
  } finally {
    isLocationLoading.value = false
  }
}

const onLocationBlur = () => {
  setTimeout(() => {
    showLocationSuggestions.value = false
    if (locationSearch.value && !selectedLocation.value) {
      const found = locationSuggestions.value.find(l => 
        l.name.toLowerCase() === locationSearch.value.toLowerCase().trim()
      )
      if (found) {
        selectLocation(found)
      }
    }
  }, 200)
}

const selectLocation = (location) => {
  selectedLocation.value = location
  locationSearch.value = location.name
  createForm.location = location.id
  showLocationSuggestions.value = false
}

// Client autocomplete methods
const onClientInput = async () => {
  selectedClient.value = null
  createForm.client = ''
  
  if (clientSearch.value.length < 2) {
    clientSuggestions.value = []
    showClientSuggestions.value = false
    return
  }
  
  try {
    isClientLoading.value = true
    const results = await store.autocompleteClients(clientSearch.value)
    clientSuggestions.value = results || []
    showClientSuggestions.value = results.length > 0
  } catch (e) {
    console.error('Failed to autocomplete clients:', e)
    clientSuggestions.value = []
  } finally {
    isClientLoading.value = false
  }
}

const onClientBlur = () => {
  setTimeout(() => {
    showClientSuggestions.value = false
    if (clientSearch.value && !selectedClient.value) {
      const found = clientSuggestions.value.find(c => 
        c.name.toLowerCase() === clientSearch.value.toLowerCase().trim()
      )
      if (found) {
        selectClient(found)
      }
    }
  }, 200)
}

const selectClient = (client) => {
  selectedClient.value = client
  clientSearch.value = client.name
  createForm.client = client.id
  showClientSuggestions.value = false
}

// Manager autocomplete methods
const onManagerInput = async () => {
  selectedManager.value = null
  createForm.tech_manager = ''
  
  if (managerSearch.value.length < 2) {
    managerSuggestions.value = []
    showManagerSuggestions.value = false
    return
  }
  
  try {
    isManagerLoading.value = true
    const results = await store.autocompleteManagers(managerSearch.value)
    managerSuggestions.value = results || []
    showManagerSuggestions.value = results.length > 0
  } catch (e) {
    console.error('Failed to autocomplete managers:', e)
    managerSuggestions.value = []
  } finally {
    isManagerLoading.value = false
  }
}

const onManagerBlur = () => {
  setTimeout(() => {
    showManagerSuggestions.value = false
    if (managerSearch.value && !selectedManager.value) {
      const found = managerSuggestions.value.find(m => 
        (m.full_name || m.name || '').toLowerCase() === managerSearch.value.toLowerCase().trim()
      )
      if (found) {
        selectManager(found)
      }
    }
  }, 200)
}

const selectManager = (manager) => {
  selectedManager.value = manager
  managerSearch.value = manager.full_name || manager.name
  createForm.tech_manager = manager.id
  showManagerSuggestions.value = false
}

// Filter methods
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

// Open create project modal
async function openCreateProject() {
  resetForm()
  if (statuses.value && statuses.value.length > 0) {
    createForm.status = statuses.value[0].id
  }
  showCreateProjectForm.value = true
  await nextTick()
  nextOnboardingStep()
}

// Close create project modal
function closeCreateProjectForm() {
  showCreateProjectForm.value = false
  resetForm()
}

// Submit create project
async function submitCreateProject() {
  if (!createFormRef.value?.checkValidity()) return
  
  const payload = {
    name: createForm.name,
    client: createForm.client ? Number(createForm.client) : null,
    status: createForm.status ? Number(createForm.status) : null,
    tech_manager: createForm.tech_manager ? Number(createForm.tech_manager) : null,
    location: createForm.location ? Number(createForm.location) : null,
    full_location_name: createForm.full_location_name || '',
    created_at: createForm.created_at || null, 
  }
  
  try {
    await store.createProject(payload)
    closeCreateProjectForm()
    await store.fetchProjects()
  } catch (e) {
    console.error('Failed to create project:', e)
  }
}

// Client CRUD
function openCreateClient() {
  resetClientForm()
  showCreateClientForm.value = true
}

function closeCreateClientForm() {
  showCreateClientForm.value = false
  resetClientForm()
}

async function submitCreateClient() {
  if (!clientForm.name) {
    error.value = 'Название клиента обязательно'
    return
  }
  
  const payload = {
    name: clientForm.name,
    type: 'CLIENT',
    contacts: clientForm.contacts || '',
    address: clientForm.address || '',
  }
  
  try {
    const created = await store.createCounterparty(payload)
    await store.fetchClients()
    
    createForm.client = created.id
    clientSearch.value = created.name
    selectedClient.value = created
    clientSuggestions.value = []
    showClientSuggestions.value = false
    
    closeCreateClientForm()
  } catch (e) {
    console.error('Failed to create client:', e)
    error.value = 'Ошибка создания клиента'
  }
}

// Manager CRUD
function openCreateManager() {
  resetManagerForm()
  showCreateManagerForm.value = true
}

function closeCreateManagerForm() {
  showCreateManagerForm.value = false
  resetManagerForm()
}

async function submitCreateManager() {
  if (!managerForm.full_name) {
    error.value = 'ФИО менеджера обязательно'
    return
  }
  
  const payload = {
    full_name: managerForm.full_name,
    contacts: managerForm.contacts || '',
  }
  
  try {
    const created = await store.createTechnicalManager(payload)
    await store.fetchManagers()
    
    createForm.tech_manager = created.id
    managerSearch.value = created.full_name || created.name
    selectedManager.value = created
    managerSuggestions.value = []
    showManagerSuggestions.value = false
    
    closeCreateManagerForm()
  } catch (e) {
    console.error('Failed to create manager:', e)
    error.value = 'Ошибка создания менеджера'
  }
}

// --- История изменений ---
async function openHistory(project) {
  historyProject.value = project
  historyLoading.value = true
  historyData.value = []
  showHistoryModal.value = true
  
  try {
    const data = await store.fetchProjectHistory(project.id)
    historyData.value = data || []
    console.log('History data loaded:', data)
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

function getFieldDisplayValue(field, value) {
  if (value === null || value === undefined || value === '') return '—'
  
  if (field === 'client_id') {
    const client = clients.value.find(c => c.id === Number(value))
    return client ? client.name : `Клиент #${value}`
  }
  
  if (field === 'status_id') {
    const status = statuses.value.find(s => s.id === Number(value))
    return status ? status.name : `Статус #${value}`
  }
  
  if (field === 'tech_manager_id') {
    const manager = managers.value.find(m => m.id === Number(value))
    return manager ? (manager.full_name || manager.name) : `Менеджер #${value}`
  }
  
  if (field === 'location_id') {
    const location = locations.value.find(l => l.id === Number(value))
    return location ? location.name : `Локация #${value}`
  }
  
  if (field === 'created_at' && value) {
    return new Date(value).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return value
}

function getFieldLabel(field) {
  const labels = {
    'name': 'Название',
    'client_id': 'Клиент',
    'tech_manager_id': 'Тех. менеджер',
    'location_id': 'Локация',
    'created_at': 'Дата создания',
    'status_id': 'Статус'
  }
  return labels[field] || field
}

function getChanges(current, previous) {
  if (!previous) return null
  
  const changes = []
  const fields = ['name', 'client_id', 'tech_manager_id', 'location_id', 'created_at', 'status_id']
  
  for (const field of fields) {
    const oldValue = previous[field]
    const newValue = current[field]
    
    if (oldValue !== newValue) {
      changes.push({
        field: field,
        label: getFieldLabel(field),
        oldValue: getFieldDisplayValue(field, oldValue),
        newValue: getFieldDisplayValue(field, newValue)
      })
    }
  }
  
  return changes
}

function getHistoryTypeLabel(type) {
  const labels = {
    '+': 'Создание',
    '~': 'Изменение',
    '-': 'Удаление'
  }
  return labels[type] || type
}

function getHistoryTypeClass(type) {
  const classes = {
    '+': 'history-created',
    '~': 'history-changed',
    '-': 'history-deleted'
  }
  return classes[type] || ''
}

// Init
onMounted(() => {
  store.fetchProjects().catch(() => {})
  store.fetchStatuses().catch(() => {})
  store.fetchClients().catch(() => {})
  store.fetchManagers().catch(() => {})
  store.fetchLocations().catch(() => {})
})

function open(id) {
  router.push({ name: 'project-detail', params: { id } })
}
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

    <!-- Фильтры по статусам в виде плиток -->
    <div v-if="statusesWithCount.length" class="status-filters">
      <div class="status-filters-header">
        <span class="status-filters-title">Фильтр по статусу:</span>
        <button v-if="activeFilterCount > 0" class="btn btn-ghost btn-sm" @click="clearFilters">
          ✕ Сбросить фильтр
        </button>
      </div>
      <div class="status-tiles">
        <div 
          v-for="status in statusesWithCount" 
          :key="status.id"
          class="status-tile"
          :class="{ active: selectedStatusId === status.id, disabled: status.count === 0 }"
          @click="status.count > 0 && selectStatus(status.id)"
        >
          <span class="status-name">{{ status.name }}</span>
          <span class="status-count">{{ status.count }}</span>
        </div>
      </div>
    </div>

    <!-- Информация о фильтре -->
    <div v-if="selectedStatusId" class="filter-info">
      <span>Показаны проекты со статусом: 
        <strong>{{ statuses.find(s => s.id === selectedStatusId)?.name }}</strong>
      </span>
      <span class="filter-info-count">({{ filteredProjects.length }} проектов)</span>
    </div>

    <div v-if="loading && !projects.length" class="state">Загрузка…</div>
    <div v-else-if="!filteredProjects.length && !error" class="state muted">
      {{ selectedStatusId ? 'Нет проектов с выбранным статусом.' : 'Нет проектов.' }}
    </div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Клиент</th>
            <th>Статус</th>
            <th>Локация</th>
            <th>Создан</th>
            <th class="actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProjects" :key="p.id" @click="open(p.id)" class="clickable">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ store.clientName(p.client) }}</td>
            <td>
              <span class="status-badge" :style="{ backgroundColor: p.status_color || '#16181C' }">
                {{ store.statusName(p.status) }}
              </span>
            </td>
            <td>{{ p.full_location_name || '—' }}</td>
            <td>{{ p.created_at?.slice(0, 10) }}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" @click.stop="open(p.id)">Открыть</button>
              <button class="btn btn-ghost btn-sm" @click.stop="openHistory(p)" title="История изменений">
                📜
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка: Создание проекта -->
    <div v-if="showCreateProjectForm" class="modal-backdrop" @click.self="closeCreateProjectForm">
      <div class="modal">
        <h2>Создать проект</h2>
        <form ref="createFormRef" @submit.prevent="submitCreateProject">
          <label class="field" id="project-name-field">
            <span>Название проекта *</span>
            <input v-model="createForm.name" type="text" required maxlength="255" placeholder="Введите название проекта" />
          </label>
          <label class="field" id="project-date-field">
            <span>Дата создания</span>
            <input 
              v-model="createForm.created_at" 
              type="datetime-local" 
              @focus="$event.target.showPicker?.()"
              @click="$event.target.showPicker?.()"
            />
            <small class="hint">Укажите дату для старых проектов. Если не заполнено - будет установлена текущая</small>
          </label>
          
          <!-- Поле клиента с автокомплитом -->
          <label class="field" id="project-client-field">
            <span>Клиент</span>
            <div class="combobox-wrapper">
              <input
                v-model="clientSearch"
                type="text"
                placeholder="Введите название клиента"
                @input="onClientInput"
                @focus="clientSearch.length >= 2 && onClientInput()"
                @blur="onClientBlur"
                autocomplete="off"
                id="client-list"
              />
              <div v-if="isClientLoading" class="combobox-loading">⏳</div>
              <ul v-if="showClientSuggestions && clientSuggestions.length > 0" class="combobox-suggestions">
                <li 
                  v-for="client in clientSuggestions" 
                  :key="client.id"
                  @mousedown.prevent="selectClient(client)"
                >
                  {{ client.name }}
                </li>
              </ul>
            </div>
            <small v-if="selectedClient" class="hint success">
              Выбран клиент: {{ selectedClient.name }}
            </small>
            <button id="add-new-client-btn" type="button" class="btn btn-ghost btn-sm" @click="openCreateClient" style="margin-top: 4px;">
              + Создать нового клиента
            </button>
          </label>
          
          <label class="field" id="project-status-field">
            <span>Статус</span>
            <select v-model="createForm.status" id="status-list">
              <option value="">— не выбран —</option>
              <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>
          
          <!-- Поле тех. менеджера с автокомплитом -->
          <label class="field" id="tech-manager-field">
            <span>Технический менеджер</span>
            <div class="combobox-wrapper">
              <input
                v-model="managerSearch"
                type="text"
                placeholder="Введите ФИО менеджера"
                @input="onManagerInput"
                @focus="managerSearch.length >= 2 && onManagerInput()"
                @blur="onManagerBlur"
                autocomplete="off"
                id="tech-manager-list"
              />
              <div v-if="isManagerLoading" class="combobox-loading">⏳</div>
              <ul v-if="showManagerSuggestions && managerSuggestions.length > 0" class="combobox-suggestions">
                <li 
                  v-for="manager in managerSuggestions" 
                  :key="manager.id"
                  @mousedown.prevent="selectManager(manager)"
                >
                  {{ manager.full_name || manager.name }}
                </li>
              </ul>
            </div>
            <small v-if="selectedManager" class="hint success">
              Выбран менеджер: {{ selectedManager.full_name || selectedManager.name }}
            </small>
            <button type="button" id="add-new-tech-manager-btn" class="btn btn-ghost btn-sm" @click="openCreateManager" style="margin-top: 4px;">
              + Создать нового менеджера
            </button>
          </label>
          
          <!-- Поле локации с автокомплитом -->
          <label class="field" id="project-location-field">
            <span>Локация</span>
            <div class="combobox-wrapper">
              <input
                v-model="locationSearch"
                type="text"
                placeholder="Введите название локации"
                @input="onLocationInput"
                @focus="locationSearch.length >= 2 && onLocationInput()"
                @blur="onLocationBlur"
                autocomplete="off"
              />
              <div v-if="isLocationLoading" class="combobox-loading">⏳</div>
              <ul v-if="showLocationSuggestions && locationSuggestions.length > 0" class="combobox-suggestions">
                <li 
                  v-for="location in locationSuggestions" 
                  :key="location.id"
                  @mousedown.prevent="selectLocation(location)"
                >
                  {{ location.full_name }}
                </li>
              </ul>
            </div>
            <small v-if="selectedLocation" class="hint success">
              Выбрана локация: {{ selectedLocation.name }}
            </small>
            <small v-else-if="locationSearch && !selectedLocation" class="hint">
              Начните вводить название для поиска
            </small>
          </label>
          
          <label class="field" id="project-locatin-full-name">
            <span>Полное название локации</span>
            <input v-model="createForm.full_location_name" type="text" maxlength="255" placeholder="Например: Москва, ул. Тверская, д. 1" />
          </label>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeCreateProjectForm">Отмена</button>
            <button type="submit" class="btn btn-primary" id="project-create-btn" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: Создание клиента -->
    <div v-if="showCreateClientForm" class="modal-backdrop" @click.self="closeCreateClientForm">
      <div class="modal modal-sm">
        <h2>Новый клиент</h2>
        <form @submit.prevent="submitCreateClient">
          <label class="field">
            <span>Название *</span>
            <input v-model="clientForm.name" type="text" required maxlength="255" placeholder="Введите название клиента" />
          </label>
          <label class="field">
            <span>Контакты</span>
            <input v-model="clientForm.contacts" type="text" placeholder="Телефон, email" />
          </label>
          <label class="field">
            <span>Адрес</span>
            <input v-model="clientForm.address" type="text" placeholder="Адрес клиента" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeCreateClientForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: Создание менеджера -->
    <div v-if="showCreateManagerForm" class="modal-backdrop" @click.self="closeCreateManagerForm">
      <div class="modal modal-sm">
        <h2>Новый технический менеджер</h2>
        <form @submit.prevent="submitCreateManager">
          <label class="field">
            <span>ФИО *</span>
            <input v-model="managerForm.full_name" type="text" required maxlength="255" placeholder="Введите ФИО менеджера" />
          </label>
          <label class="field">
            <span>Контакты</span>
            <input v-model="managerForm.contacts" type="text" placeholder="Телефон, email" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeCreateManagerForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
        </form>
      </div>
    </div>

    <!-- Модалка: История изменений -->
    <div v-if="showHistoryModal" class="modal-backdrop" @click.self="closeHistory">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>История изменений</h2>
          <button class="btn btn-ghost btn-sm" @click="closeHistory">✕</button>
        </div>
        
        <div v-if="historyProject" class="history-project-info">
          <strong>{{ historyProject.name }}</strong>
          <span class="muted">ID: {{ historyProject.id }}</span>
        </div>
        
        <div v-if="historyLoading" class="state">Загрузка истории...</div>
        
        <div v-else-if="historyData.length === 0" class="state muted">
          История изменений отсутствует
        </div>
        
        <div v-else class="history-timeline">
          <div 
            v-for="(record, index) in historyData" 
            :key="record.history_id"
            class="history-item"
            :class="getHistoryTypeClass(record.history_type)"
          >
            <div class="history-header">
              <span class="history-type" :class="getHistoryTypeClass(record.history_type)">
                {{ getHistoryTypeLabel(record.history_type) }}
              </span>
              <span class="history-date">{{ new Date(record.history_date).toLocaleString('ru-RU') }}</span>
              <span class="history-user" v-if="record.history_user">
                {{ record.history_user }}
              </span>
            </div>
            
            <div class="history-changes">
              <!-- Создание -->
              <div v-if="record.history_type === '+'" class="history-change">
                <div class="history-change-title">Создан проект</div>
                <div class="history-change-values">
                  <div class="history-value">
                    <span class="history-label">Название:</span>
                    <span>{{ record.name }}</span>
                  </div>
                  <div class="history-value">
                    <span class="history-label">Клиент:</span>
                    <span>{{ getFieldDisplayValue('client_id', record.client_id) }}</span>
                  </div>
                  <div class="history-value">
                    <span class="history-label">Статус:</span>
                    <span>{{ getFieldDisplayValue('status_id', record.status_id) }}</span>
                  </div>
                  <div class="history-value" v-if="record.tech_manager_id">
                    <span class="history-label">Менеджер:</span>
                    <span>{{ getFieldDisplayValue('tech_manager_id', record.tech_manager_id) }}</span>
                  </div>
                  <div class="history-value" v-if="record.location_id">
                    <span class="history-label">Локация:</span>
                    <span>{{ getFieldDisplayValue('location_id', record.location_id) }}</span>
                  </div>
                  <div class="history-value" v-if="record.created_at">
                    <span class="history-label">Дата создания:</span>
                    <span>{{ getFieldDisplayValue('created_at', record.created_at) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Изменение -->
              <div v-else-if="record.history_type === '~'" class="history-change">
                <div class="history-change-title">Изменены поля</div>
                <div class="history-change-values">
                  <template v-if="index < historyData.length - 1">
                    <div 
                      v-for="change in getChanges(record, historyData[index + 1])" 
                      :key="change.field"
                      class="history-change-item"
                    >
                      <div class="history-change-field">{{ change.label }}</div>
                      <div class="history-change-diff">
                        <span class="history-old-value">{{ change.oldValue }}</span>
                        <span class="history-arrow">→</span>
                        <span class="history-new-value">{{ change.newValue }}</span>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="history-value">
                      <span class="history-label">Название:</span>
                      <span>{{ record.name }}</span>
                    </div>
                    <div class="history-value">
                      <span class="history-label">Клиент:</span>
                      <span>{{ getFieldDisplayValue('client_id', record.client_id) }}</span>
                    </div>
                    <div class="history-value">
                      <span class="history-label">Статус:</span>
                      <span>{{ getFieldDisplayValue('status_id', record.status_id) }}</span>
                    </div>
                  </template>
                </div>
              </div>
              
              <!-- Удаление -->
              <div v-else-if="record.history_type === '-'" class="history-change">
                <div class="history-change-title">Проект удален</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeHistory">Закрыть</button>
        </div>
      </div>
    </div>

    <OnboardingMenu>
      <!-- Все ваши кнопки запуска инструкций -->
      <button 
        class="onboarding-start-btn" 
        @click="startTour"
      >
        <span class="btn-icon">📁</span>
        Создать проект
        <span class="btn-glow"></span>
      </button>
    </OnboardingMenu>
  </section>
</template>
<style scoped>
/* Стили для истории */
.history-timeline {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px 0;
}

.history-item {
  border-left: 3px solid #e0e0e0;
  padding: 12px 20px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  position: relative;
}

.history-item.history-created {
  border-left-color: #28a745;
  background: #f0f9f0;
}

.history-item.history-changed {
  border-left-color: #ffc107;
  background: #fff9e6;
}

.history-item.history-deleted {
  border-left-color: #dc3545;
  background: #fdf0f0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.history-type {
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
  background: #e0e0e0;
  color: #333;
}

.history-type.history-created {
  background: #28a745;
  color: white;
}

.history-type.history-changed {
  background: #ffc107;
  color: #333;
}

.history-type.history-deleted {
  background: #dc3545;
  color: white;
}

.history-date {
  color: #666;
  font-size: 13px;
}

.history-user {
  color: #666;
  font-size: 13px;
  margin-left: auto;
}

.history-changes {
  padding-left: 4px;
}

.history-change-field {
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.history-change-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-value {
  display: flex;
  gap: 8px;
  font-size: 14px;
  padding: 2px 0;
}

.history-label {
  color: #666;
  min-width: 140px;
  font-weight: 500;
}

.history-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-lg {
  max-width: 800px;
  width: 90%;
}

/* Адаптив для мобильных */
@media (max-width: 768px) {
  .history-value {
    flex-direction: column;
    gap: 2px;
  }
  
  .history-label {
    min-width: auto;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-user {
    margin-left: 0;
  }
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
   ЗАГОЛОВОК СТРАНИЦЫ
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(201, 168, 106, 0.15);
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 600;
  color: #C9A86A;
}

.page-header .muted {
  color: rgba(208, 210, 213, 0.5);
  font-size: 14px;
}

/* ============================================
   ФИЛЬТРЫ ПО СТАТУСАМ (ПЛИТКИ)
   ============================================ */
.status-filters {
  background: rgba(59, 59, 59, 0.03);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.status-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-filters-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(208, 210, 213, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-tile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.04);
  border: 2px solid rgba(208, 210, 213, 0.1);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
  user-select: none;
  color: #D0D2D5;
}

.status-tile:hover:not(.disabled) {
  border-color: rgba(201, 168, 106, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

.status-tile.active {
  border-color: #C9A86A;
  background: rgba(201, 168, 106, 0.12);
  color: #C9A86A;
  box-shadow: 0 0 20px rgba(201, 168, 106, 0.05);
}

.status-tile.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.status-tile .status-name {
  font-weight: 500;
}

.status-tile .status-count {
  background: rgba(255, 255, 255, 0.06);
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.5);
  font-weight: 500;
}

.status-tile.active .status-count {
  background: rgba(201, 168, 106, 0.15);
  color: #C9A86A;
}

/* ============================================
   ИНФОРМАЦИЯ О ФИЛЬТРЕ
   ============================================ */
.filter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(201, 168, 106, 0.06);
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #D0D2D5;
}

.filter-info strong {
  color: #C9A86A;
}

.filter-info-count {
  color: rgba(208, 210, 213, 0.5);
  font-size: 13px;
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
  background: rgba(220, 38, 38, 0.12);
  color: #f87171;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.alert-error strong {
  color: #f87171;
}

.state {
  padding: 40px;
  text-align: center;
  color: rgba(208, 210, 213, 0.4);
  font-size: 16px;
}

/* ============================================
   ТАБЛИЦА ПРОЕКТОВ
   ============================================ */
.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #D0D2D5;
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(208, 210, 213, 0.05);
  white-space: nowrap;
}

.table th {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 600;
  color: rgba(208, 210, 213, 0.5);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.table tr {
  transition: background 0.15s;
}

.table tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

.table .clickable {
  cursor: pointer;
}

.actions {
  white-space: nowrap;
}

/* ============================================
   СТАТУС-БЕЙДЖ В ТАБЛИЦЕ
   ============================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #D0D2D5;
  background: #16181C;
  border: 1px solid rgba(208, 210, 213, 0.08);
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
  background: #C9A86A;
  color: #16181C;
}

.btn-primary:hover:not(:disabled) {
  background: #d4b87a;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(201, 168, 106, 0.3);
}

.btn-ghost {
  background: transparent;
  color: #D0D2D5;
  border-color: rgba(208, 210, 213, 0.15);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 210, 213, 0.25);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.15);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-pay {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.12);
}

.btn-pay:hover {
  background: rgba(74, 222, 128, 0.18);
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
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #1e2126;
  border: 1px solid rgba(201, 168, 106, 0.12);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #C9A86A;
}

.modal-sm {
  max-width: 400px;
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
  color: rgba(208, 210, 213, 0.5);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(208, 210, 213, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #D0D2D5;
  transition: all 0.2s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(208, 210, 213, 0.25);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);
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
  border: 1px solid rgba(208, 210, 213, 0.12);
  border-radius: 8px;
  padding: 8px 30px 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #D0D2D5;
  transition: all 0.2s ease;
}

.combobox-wrapper input::placeholder {
  color: rgba(208, 210, 213, 0.25);
}

.combobox-wrapper input:focus {
  outline: none;
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.1);
}

.combobox-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.3);
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
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 8px;
  margin: 4px 0 0;
  padding: 4px 0;
  list-style: none;
  z-index: 101;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.combobox-suggestions li {
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: #D0D2D5;
}

.combobox-suggestions li:hover {
  background: rgba(201, 168, 106, 0.08);
}

.combobox-suggestions li:not(:last-child) {
  border-bottom: 1px solid rgba(208, 210, 213, 0.04);
}

.combobox-suggestions .combobox-create-new {
  color: #C9A86A;
  font-weight: 500;
  border-top: 1px solid rgba(201, 168, 106, 0.1);
}

.combobox-suggestions .combobox-create-new:hover {
  background: rgba(201, 168, 106, 0.08);
}

/* ============================================
   ПОДСКАЗКИ (HINT)
   ============================================ */
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.35);
}

.hint.success {
  color: #4ade80;
}

/* ============================================
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(208, 210, 213, 0.05);
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

  .status-tiles {
    gap: 6px;
  }

  .status-tile {
    padding: 4px 12px;
    font-size: 13px;
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

  .filter-info {
    flex-wrap: wrap;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .status-tiles {
    gap: 4px;
  }

  .status-tile {
    padding: 3px 10px;
    font-size: 12px;
  }

  .status-tile .status-count {
    padding: 0 6px;
    font-size: 10px;
  }

  .table th,
  .table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.25);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.4);}
  
  .onboarding-start-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: #16181C;
  color: #C9A86A;
  border: 1px solid #C9A86A;
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
  background: radial-gradient(circle at center, rgba(201, 168, 106, 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.onboarding-start-btn:hover {
  background: #C9A86A;
  color: #16181C;
  box-shadow: 
    0 0 20px rgba(201, 168, 106, 0.3),
    inset 0 0 20px rgba(201, 168, 106, 0.1);
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
    #C9A86A 20%,
    #FF6B35 40%,
    #FF4500 60%,
    #FF6B35 80%,
    #C9A86A 100%
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

  </style>