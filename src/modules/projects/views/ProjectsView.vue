<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const router = useRouter()
const store = useProjectsStore()
const { projects, loading, error, count, statuses, clients, managers, locations } = storeToRefs(store)

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

// Manager form - исправлено: contacts вместо email и phone
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

// Manager CRUD - исправлено: передаем только full_name и contacts
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

    <div v-if="loading && !projects.length" class="state">Загрузка…</div>
    <div v-else-if="!projects.length && !error" class="state muted">Нет проектов.</div>

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
          <tr v-for="p in projects" :key="p.id" @click="open(p.id)" class="clickable">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ store.clientName(p.client) }}</td>
            <td>{{ store.statusName(p.status) }}</td>
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

    <!-- Модалка: Создание менеджера - исправлено -->
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
.page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #1f2937; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
.muted { color: #6b7280; font-size: 14px; }
.hint { display: block; margin-top: 4px; font-size: 12px; color: #6b7280; }
.hint.success { color: #28a745; }
.alert { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.state { padding: 32px; text-align: center; }
.table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.table th { background: #f8fafc; font-weight: 600; color: #475569; }
.clickable { cursor: pointer; }
.clickable:hover { background: #f9fafb; }
.actions { white-space: nowrap; }

.btn { border: 1px solid transparent; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.btn-sm { padding: 4px 10px; font-size: 16px; line-height: 1; min-width: 32px; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-ghost { background: transparent; color: #334155; border-color: #cbd5e1; }
.btn-ghost:hover { background: #f1f5f9; }

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

.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
.modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); max-height: 90vh; overflow-y: auto; }
.modal-sm { max-width: 400px; }
.modal h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
.field { display: block; margin-bottom: 14px; }
.field span { display: block; margin-bottom: 4px; font-size: 13px; color: #374151; font-weight: 500; }
.field input, .field select { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; }
.field input:focus, .field select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>