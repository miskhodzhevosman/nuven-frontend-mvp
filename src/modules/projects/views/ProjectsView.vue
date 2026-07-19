<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const router = useRouter()
const store = useProjectsStore()
const { projects, loading, error, count, statuses, clients, managers, locations } = storeToRefs(store)

// Фильтр по статусу
const selectedStatusId = ref(null)

// Computed - фильтруем проекты по статусу и сортируем
const filteredProjects = computed(() => {
  let result = [...projects.value]
  
  // Фильтр по статусу
  if (selectedStatusId.value) {
    result = result.filter(p => p.status === Number(selectedStatusId.value))
  }
  
  // Сортировка: сначала новые (по created_at или updated_at)
  result.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at)
    const dateB = new Date(b.updated_at || b.created_at)
    return dateB - dateA // от новых к старым
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

// Computed - фильтруем локации только с типом CITY
const filteredLocations = computed(() => {
  if (!locations.value) return []
  return locations.value.filter(l => l.type === 'CITY')
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

// Reset forms
function resetForm() {
  createForm.name = ''
  createForm.client = ''
  createForm.status = ''
  createForm.tech_manager = ''
  createForm.location = ''
  createForm.full_location_name = ''
  locationSearch.value = ''
  selectedLocation.value = null
  showLocationSuggestions.value = false
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

// Location autocomplete computed
const filteredLocationSuggestions = computed(() => {
  if (!locationSearch.value) return filteredLocations.value.slice(0, 10)
  const search = locationSearch.value.toLowerCase().trim()
  return filteredLocations.value
    .filter(l => l.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// Location autocomplete methods
const onLocationInput = () => {
  if (selectedLocation.value && locationSearch.value !== selectedLocation.value.name) {
    selectedLocation.value = null
    createForm.location = ''
  }
  showLocationSuggestions.value = true
}

const onLocationBlur = () => {
  setTimeout(() => {
    showLocationSuggestions.value = false
    if (locationSearch.value && !selectedLocation.value) {
      const found = filteredLocations.value.find(l => 
        l.name.toLowerCase() === locationSearch.value.toLowerCase().trim()
      )
      if (found) {
        selectLocation(found)
      }
    }
  }, 200)
}

const toggleLocationSuggestions = () => {
  showLocationSuggestions.value = !showLocationSuggestions.value
  if (showLocationSuggestions.value && !locationSearch.value) {
    locationSearch.value = ''
  }
}

const selectLocation = (location) => {
  selectedLocation.value = location
  locationSearch.value = location.name
  createForm.location = location.id
  showLocationSuggestions.value = false
}

// Filter methods
function selectStatus(statusId) {
  if (selectedStatusId.value === statusId) {
    selectedStatusId.value = null // Снимаем фильтр при повторном клике
  } else {
    selectedStatusId.value = statusId
  }
}

function clearFilters() {
  selectedStatusId.value = null
}

// Open create project modal
function openCreateProject() {
  resetForm()
  if (statuses.value && statuses.value.length > 0) {
    createForm.status = statuses.value[0].id
  }
  showCreateProjectForm.value = true
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
    closeCreateManagerForm()
  } catch (e) {
    console.error('Failed to create manager:', e)
    error.value = 'Ошибка создания менеджера'
  }
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
      <button class="btn btn-primary" @click="openCreateProject">+ Создать проект</button>
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
            <td class="actions"><button class="btn btn-ghost" @click.stop="open(p.id)">Открыть →</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка: Создание проекта -->
    <div v-if="showCreateProjectForm" class="modal-backdrop" @click.self="closeCreateProjectForm">
      <div class="modal">
        <h2>Создать проект</h2>
        <form ref="createFormRef" @submit.prevent="submitCreateProject">
          <label class="field">
            <span>Название проекта *</span>
            <input v-model="createForm.name" type="text" required maxlength="255" placeholder="Введите название проекта" />
          </label>
          <label class="field">
  <span>Дата создания</span>
  <input v-model="createForm.created_at" type="datetime-local" />
  <small class="hint">Укажите дату для старых проектов. Если не заполнено - будет установлена текущая</small>
</label>
          
          <label class="field">
            <span>Клиент</span>
            <div class="row">
              <select v-model="createForm.client">
                <option value="">— не выбран —</option>
                <option v-for="c in filteredClients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <button type="button" class="btn btn-ghost btn-sm" @click="openCreateClient">+</button>
            </div>
            <small class="hint">Показываются только контрагенты с типом "Client"</small>
          </label>
          
          <label class="field">
            <span>Статус</span>
            <select v-model="createForm.status">
              <option value="">— не выбран —</option>
              <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </label>
          
          <label class="field">
            <span>Технический менеджер</span>
            <div class="row">
              <select v-model="createForm.tech_manager">
                <option value="">— не выбран —</option>
                <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.full_name || m.name }}</option>
              </select>
              <button type="button" class="btn btn-ghost btn-sm" @click="openCreateManager">+</button>
            </div>
          </label>
          
          <!-- Поле локации с autocomplete -->
          <label class="field">
            <span>Локация</span>
            <div class="combobox-wrapper">
              <input
                v-model="locationSearch"
                type="text"
                placeholder="Введите или выберите локацию"
                @input="onLocationInput"
                @focus="showLocationSuggestions = true"
                @blur="onLocationBlur"
                autocomplete="off"
              />
              <button 
                type="button" 
                class="combobox-toggle" 
                @mousedown.prevent="toggleLocationSuggestions"
              >
                ▼
              </button>
              <ul v-if="showLocationSuggestions && filteredLocationSuggestions.length > 0" class="combobox-suggestions">
                <li 
                  v-for="location in filteredLocationSuggestions" 
                  :key="location.id"
                  @mousedown.prevent="selectLocation(location)"
                >
                  {{ location.name }}
                </li>
              </ul>
            </div>
            <small v-if="selectedLocation" class="hint success">
              Выбрана локация: {{ selectedLocation.name }}
            </small>
            <small v-else-if="locationSearch && !selectedLocation" class="hint">
              Начните вводить название для поиска
            </small>
            <small class="hint">Показываются только локации с типом "Город"</small>
          </label>
          
          <label class="field">
            <span>Полное название локации</span>
            <input v-model="createForm.full_location_name" type="text" maxlength="255" placeholder="Например: Москва, ул. Тверская, д. 1" />
          </label>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeCreateProjectForm">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Создать</button>
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
  </section>
</template>

<style scoped>

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
  background: rgba(201, 168, 106, 0.4);
}</style>