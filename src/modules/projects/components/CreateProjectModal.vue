<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const store = useProjectsStore()
const { clients, managers, locations } = storeToRefs(store)

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'created', 'open-client', 'open-manager'])

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

const createFormRef = ref(null)

// Reset form
function resetForm() {
  createForm.name = ''
  createForm.client = ''
  createForm.status = ''
  createForm.tech_manager = ''
  createForm.location = ''
  createForm.full_location_name = ''
  createForm.created_at = ''
  
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
      const found = managerSuggestions.value.find(m => {
        const fullName = getManagerFullName(m)
        return fullName.toLowerCase() === managerSearch.value.toLowerCase().trim() ||
               (m.username && m.username.toLowerCase() === managerSearch.value.toLowerCase().trim())
      })
      if (found) {
        selectManager(found)
      }
    }
  }, 200)
}

const selectManager = (manager) => {
  selectedManager.value = manager
  managerSearch.value = getManagerFullName(manager) || manager.username
  createForm.tech_manager = manager.id
  showManagerSuggestions.value = false
}

// Helper functions
const getManagerFullName = (manager) => {
  if (!manager) return ''
  const parts = []
  if (manager.last_name) parts.push(manager.last_name)
  if (manager.first_name) parts.push(manager.first_name)
  if (manager.patronymic) parts.push(manager.patronymic)
  return parts.join(' ') || manager.username || 'Без имени'
}

// Submit
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
    emit('created')
  } catch (e) {
    console.error('Failed to create project:', e)
  }
}

function close() {
  resetForm()
  emit('close')
}

// Init
onMounted(() => {
  if (props.statuses && props.statuses.length > 0) {
    createForm.status = props.statuses[0].id
  }
})
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
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
            type="date"
            @focus="$event.target.showPicker?.()"
            @click="$event.target.showPicker?.()"
          />
          <small class="hint">Укажите дату для старых проектов. Если не заполнено - будет установлена текущая</small>
        </label>
        
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
          <button id="add-new-client-btn" type="button" class="btn btn-ghost btn-sm" @click="emit('open-client')" style="margin-top: 4px;">
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
                {{ manager.first_name}} {{ manager.last_name }} {{ manager.patronymic }}
              </li>
            </ul>
          </div>
          <small v-if="selectedManager" class="hint success">
            Выбран менеджер: {{ selectedManager.first_name}} {{ selectedManager.last_name }} {{ selectedManager.patronymic }}
          </small>
          <button type="button" id="add-new-tech-manager-btn" class="btn btn-ghost btn-sm" @click="emit('open-manager')" style="margin-top: 4px;">
            + Создать нового менеджера
          </button>
        </label>
        
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
          <input v-model="createForm.full_location_name" disabled type="text" maxlength="255" placeholder="Например: Москва, ул. Тверская, д. 1" />
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" id="project-create-btn" :disabled="loading">Создать</button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>


<style scoped>
/* ============================================
   МОДАЛЬНЫЕ ОКНА
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #2C3E50;
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
  color: rgba(26, 26, 26, 0.6);
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  transition: all 0.2s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(26, 26, 26, 0.25);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.field select option {
  background: #FFFFFF;
  color: #1A1A1A;
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
  width: 100%;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px 30px 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  transition: all 0.2s ease;
}

.combobox-wrapper input::placeholder {
  color: rgba(26, 26, 26, 0.25);
}

.combobox-wrapper input:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.combobox-loading {
  position: absolute;
  right: 10px;
  font-size: 14px;
  color: rgba(26, 26, 26, 0.3);
}

.combobox-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin: 4px 0 0;
  padding: 4px 0;
  list-style: none;
  z-index: 101;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.combobox-suggestions li {
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: #1A1A1A;
}

.combobox-suggestions li:hover {
  background: rgba(44, 62, 80, 0.05);
}

.combobox-suggestions li:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

/* ============================================
   ПОДСКАЗКИ (HINT)
   ============================================ */
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(26, 26, 26, 0.35);
}

.hint.success {
  color: #16A34A;
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
  border-top: 1px solid rgba(0, 0, 0, 0.05);
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
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
    margin: 4px;
  }
}
</style>