<!-- modules/app/widgets/EditProjectModal/index.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>Редактировать проект</h2>
      <form ref="formRef" @submit.prevent="submit">
        <!-- Название проекта -->
        <label class="field" id="project-name-field">
          <span>Название проекта *</span>
          <input 
            v-model="form.name" 
            type="text" 
            required 
            maxlength="255" 
            placeholder="Введите название проекта" 
          />
        </label>
        
        <!-- Дата создания -->
        <label class="field" id="project-date-field">
          <span>Дата создания</span>
          <input 
            v-model="form.created_at" 
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
          <button 
            id="add-new-client-btn" 
            type="button" 
            class="btn btn-ghost btn-sm" 
            @click="openCreateClient" 
            style="margin-top: 4px;"
          >
            + Создать нового клиента
          </button>
        </label>
        
        <!-- Статус -->
        <label class="field" id="project-status-field">
          <span>Статус</span>
          <select v-model="form.status" id="status-list">
            <option value="">— не выбран —</option>
            <option v-for="s in store.statuses" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
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
          <button 
            type="button" 
            id="add-new-tech-manager-btn" 
            class="btn btn-ghost btn-sm" 
            @click="openCreateManager" 
            style="margin-top: 4px;"
          >
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
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" id="project-create-btn" :disabled="loading">
            Сохранить
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useProjectsStore } from '../../store'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  projectId: {
    type: Number,
    required: true,
  },
  project: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const store = useProjectsStore()
const { loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  name: '',
  client: '',
  status: '',
  tech_manager: '',
  location: '',
  created_at: '',
})

// --- Sub-modals ---
const showCreateClientForm = ref(false)
const showCreateManagerForm = ref(false)

// --- Client form ---
const clientForm = reactive({
  name: '',
  contacts: '',
  address: '',
})

// --- Manager form ---
const managerForm = reactive({
  full_name: '',
  contacts: '',
})

// --- Client autocomplete ---
const clientSearch = ref('')
const showClientSuggestions = ref(false)
const selectedClient = ref(null)
const clientSuggestions = ref([])
const isClientLoading = ref(false)

// --- Manager autocomplete ---
const managerSearch = ref('')
const showManagerSuggestions = ref(false)
const selectedManager = ref(null)
const managerSuggestions = ref([])
const isManagerLoading = ref(false)

// --- Location autocomplete ---
const locationSearch = ref('')
const showLocationSuggestions = ref(false)
const selectedLocation = ref(null)
const locationSuggestions = ref([])
const isLocationLoading = ref(false)

// --- Client autocomplete methods ---
const onClientInput = async () => {
  selectedClient.value = null
  form.client = ''
  
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
  form.client = client.id
  showClientSuggestions.value = false
}

// --- Manager autocomplete methods ---
const onManagerInput = async () => {
  selectedManager.value = null
  form.tech_manager = ''
  
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
  form.tech_manager = manager.id
  showManagerSuggestions.value = false
}

// --- Location autocomplete methods ---
const onLocationInput = async () => {
  selectedLocation.value = null
  form.location = ''
  
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
  form.location = location.id
  showLocationSuggestions.value = false
}

// --- Client CRUD ---
function openCreateClient() {
  clientForm.name = ''
  clientForm.contacts = ''
  clientForm.address = ''
  showCreateClientForm.value = true
}

function closeCreateClientForm() {
  showCreateClientForm.value = false
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
    
    form.client = created.id
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

// --- Manager CRUD ---
function openCreateManager() {
  managerForm.full_name = ''
  managerForm.contacts = ''
  showCreateManagerForm.value = true
}

function closeCreateManagerForm() {
  showCreateManagerForm.value = false
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
    
    form.tech_manager = created.id
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

// --- Reset form ---
function resetForm() {
  form.name = ''
  form.client = ''
  form.status = ''
  form.tech_manager = ''
  form.location = ''
  form.created_at = ''
  
  locationSearch.value = ''
  selectedLocation.value = null
  showLocationSuggestions.value = false
  locationSuggestions.value = []
  isLocationLoading.value = false
  
  clientSearch.value = ''
  selectedClient.value = null
  clientSuggestions.value = []
  showClientSuggestions.value = false
  isClientLoading.value = false
  
  managerSearch.value = ''
  selectedManager.value = null
  managerSuggestions.value = []
  showManagerSuggestions.value = false
  isManagerLoading.value = false
}

// --- Load project data when modal opens ---
watch(() => props.modelValue, (open) => {
  if (open && props.project) {
    const p = props.project
    
    form.name = p.name || ''
    form.client = p.client || ''
    form.status = p.status || ''
    form.tech_manager = p.tech_manager || ''
    form.location = p.location || ''
    form.created_at = p.created_at ? p.created_at.slice(0, 16) : ''
    
    // Загружаем клиента
    if (p.client) {
      const client = store.clients.find(c => c.id === p.client)
      if (client) {
        selectedClient.value = client
        clientSearch.value = client.name
      }
    } else {
      clientSearch.value = ''
      selectedClient.value = null
    }
    
    // Загружаем менеджера
    if (p.tech_manager) {
      const manager = store.managers.find(m => m.id === p.tech_manager)
      if (manager) {
        selectedManager.value = manager
        managerSearch.value = manager.full_name || manager.name
      }
    } else {
      managerSearch.value = ''
      selectedManager.value = null
    }
    
    // Загружаем локацию
    if (p.location) {
      const loc = store.locations.find(l => l.id === p.location)
      if (loc) {
        selectedLocation.value = loc
        locationSearch.value = loc.name
      }
    } else {
      locationSearch.value = ''
      selectedLocation.value = null
    }
  }
}, { immediate: true })

// --- Submit ---
async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  const payload = {
    name: form.name,
    client: form.client ? Number(form.client) : null,
    status: form.status ? Number(form.status) : null,
    tech_manager: form.tech_manager ? Number(form.tech_manager) : null,
    location: form.location ? Number(form.location) : null,
    created_at: form.created_at || null,
  }
  
  try {
    await store.updateProject(props.projectId, payload)
    await store.fetchProject(props.projectId)
    emit('updated')
    close()
  } catch (e) {
    console.error('Failed to update project:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
  showCreateClientForm.value = false
  showCreateManagerForm.value = false
}
</script>

<style scoped>
/* ============================================
   ТЕМНЫЕ СТИЛИ ДЛЯ EditProjectModal
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
}

.combobox-loading {
  position: absolute;
  right: 8px;
  font-size: 14px;
  color: rgba(208, 210, 213, 0.5);
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
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
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

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* ============================================
   АЛЕРТЫ
   ============================================ */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 12px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.15);
  color: #ef4444;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 640px) {
  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
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
}
</style>