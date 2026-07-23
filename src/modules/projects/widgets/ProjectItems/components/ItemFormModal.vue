<!-- modules/app/widgets/ProjectItems/components/ItemFormModal.vue -->
<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>{{ editingId ? 'Редактировать позицию' : 'Новая позиция' }}</h2>
      <form ref="formRef" @submit.prevent="submit">
        <!-- Поле: Товар (автокомплит) -->
        <label class="field">
          <span>Товар *</span>
          <div class="combobox-wrapper">
            <input
              id="item-nomenclature-field"
              v-model="searchQuery"
              type="text"
              placeholder="Введите или выберите товар"
              @input="onSearchInput"
              @focus="showSuggestions = true"
              @blur="onSearchBlur"
              required
              autocomplete="off"
            />
            <button 
              type="button" 
              class="combobox-toggle" 
              @mousedown.prevent="toggleSuggestions"
            >
              ▼
            </button>
            <ul 
              v-if="showSuggestions" 
              class="combobox-suggestions"
            >
              <li 
                v-for="n in filteredNomenclatures" 
                :key="n.id"
                @mousedown.prevent="selectNomenclature(n)"
              >
                <span class="suggestion-name">{{ n.name }}</span>
                <span v-if="n.article" class="suggestion-article">{{ n.article }}</span>
                <span class="suggestion-prices">
                  {{ formatAmount(n.current_cost_price) }} / 
                  {{ formatAmount(n.current_sale_price) }}
                </span>
              </li>
            </ul>
          </div>
          
          <!-- Кнопка создания нового товара -->
          <button
            id="item-create-nomenclature-btn"
            type="button"
            class="btn-create-nomenclature"
            @click="openNomenclatureModal"
          >
            ✚ Создать новый товар
          </button>
          
          <small v-if="selectedNomenclature" class="hint success">
            Выбран: {{ selectedNomenclature.name }}
            <span v-if="selectedNomenclature.article">({{ selectedNomenclature.article }})</span>
          </small>
          <small v-else class="hint">
            Начните вводить название или выберите из списка
          </small>
        </label>
        
        <label class="field">
          <span>Количество *</span>
          <input 
            id="item-quantity-field"
            v-model="form.quantity" 
            type="number" 
            step="0.01" 
            min="0" 
            required 
          />
        </label>
        
        <label class="field">
          <span>Фикс. себестоимость</span>
          <input 
            id="item-cost-price-field"
            v-model="form.fixed_cost_price" 
            type="number" 
            step="0.01" 
          />
          <small class="hint">Можно редактировать</small>
        </label>
        
        <label class="field">
          <span>Фикс. цена продажи</span>
          <input 
            id="item-sale-price-field"
            v-model="form.fixed_sale_price" 
            type="number" 
            step="0.01" 
          />
          <small class="hint">Можно редактировать</small>
        </label>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button 
            id="item-save-btn"
            type="submit" 
            class="btn btn-primary" 
            :disabled="loading"
          >
            Сохранить
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
    
    <!-- Supply-виджеты -->
    <NomenclatureFormModal 
      v-model="showNomenclatureModal" 
      @created="onNomenclatureCreated"
    />
    
    <FactoryFormModal 
      v-model="showFactoryModal" 
      @created="onFactoryCreated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'

// Импорт supply-виджетов
import NomenclatureFormModal from '@/modules/supply/widgets/NomenclatureFormModal/index.vue'
import FactoryFormModal from '@/modules/supply/widgets/FactoryFormModal/index.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  editingId: {
    type: Number,
    default: null,
  },
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const store = useProjectsStore()
const { nomenclatures, loading, error } = storeToRefs(store)

const formRef = ref(null)
const form = reactive({
  nomenclature: '',
  quantity: '1',
  fixed_cost_price: '',
  fixed_sale_price: '',
})

// Autocomplete state
const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedNomenclature = ref(null)

// Supply modals state
const showNomenclatureModal = ref(false)
const showFactoryModal = ref(false)

// Computed
const filteredNomenclatures = computed(() => {
  if (!nomenclatures.value) return []
  if (!searchQuery.value) return nomenclatures.value.slice(0, 10)
  const search = searchQuery.value.toLowerCase().trim()
  return nomenclatures.value
    .filter(n => 
      n.name.toLowerCase().includes(search) || 
      (n.article && n.article.toLowerCase().includes(search))
    )
    .slice(0, 10)
})

// Methods
function formatAmount(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : String(v)
}

function onSearchInput() {
  if (selectedNomenclature.value && searchQuery.value !== selectedNomenclature.value.name) {
    selectedNomenclature.value = null
    form.nomenclature = ''
    // Очищаем цены при смене выбора
    if (!props.editingId) {
      form.fixed_cost_price = ''
      form.fixed_sale_price = ''
    }
  }
  showSuggestions.value = true
}

function onSearchBlur() {
  setTimeout(() => {
    showSuggestions.value = false
    if (searchQuery.value && !selectedNomenclature.value) {
      const found = nomenclatures.value.find(n => 
        n.name.toLowerCase() === searchQuery.value.toLowerCase().trim()
      )
      if (found) {
        selectNomenclature(found)
      }
    }
  }, 200)
}

function toggleSuggestions() {
  showSuggestions.value = !showSuggestions.value
  if (showSuggestions.value && !searchQuery.value) {
    searchQuery.value = ''
  }
}

function selectNomenclature(nomenclature) {
  selectedNomenclature.value = nomenclature
  searchQuery.value = nomenclature.name
  form.nomenclature = String(nomenclature.id)
  
  // Подтягиваем цены из номенклатуры (только при создании)
  if (!props.editingId) {
    form.fixed_cost_price = nomenclature.current_cost_price || ''
    form.fixed_sale_price = nomenclature.current_sale_price || ''
  }
  
  showSuggestions.value = false
}

function openNomenclatureModal() {
  showNomenclatureModal.value = true
}

function onNomenclatureCreated(nomenclature) {
  // Обновляем список номенклатур
  store.fetchNomenclatures()
  // Автоматически выбираем созданную номенклатуру
  selectNomenclature(nomenclature)
}

function onFactoryCreated(factory) {
  // Обновляем список фабрик в supply store
  // Они уже обновятся через supply-виджет
  // Можно дополнительно обновить если нужно
}

// Reset form
function resetForm() {
  Object.assign(form, {
    nomenclature: '',
    quantity: '1',
    fixed_cost_price: '',
    fixed_sale_price: '',
  })
  searchQuery.value = ''
  selectedNomenclature.value = null
  showSuggestions.value = false
}

// Load data for editing
watch(() => props.editingId, async (id) => {
  if (id) {
    const items = store.projectItems || []
    const item = items.find(i => i.id === id)
    if (item) {
      const nomenclature = nomenclatures.value?.find(n => n.id === item.nomenclature)
      if (nomenclature) {
        searchQuery.value = nomenclature.name
        selectedNomenclature.value = nomenclature
      }
      form.nomenclature = item.nomenclature ? String(item.nomenclature) : ''
      form.quantity = item.quantity ?? '1'
      form.fixed_cost_price = item.fixed_cost_price ?? ''
      form.fixed_sale_price = item.fixed_sale_price ?? ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for nomenclature change to auto-fill prices
watch(() => form.nomenclature, (newValue) => {
  if (newValue && !props.editingId && !selectedNomenclature.value) {
    const nomenclature = nomenclatures.value?.find(n => n.id === Number(newValue))
    if (nomenclature) {
      if (!form.fixed_cost_price) {
        form.fixed_cost_price = nomenclature.current_cost_price || ''
      }
      if (!form.fixed_sale_price) {
        form.fixed_sale_price = nomenclature.current_sale_price || ''
      }
    }
  }
}, { immediate: true })

// Submit
async function submit() {
  if (!formRef.value?.checkValidity()) {
    return
  }
  
  if (!form.nomenclature) {
    error.value = 'Пожалуйста, выберите товар'
    return
  }
  
  const payload = {
    project: props.projectId,
    nomenclature: Number(form.nomenclature),
    quantity: String(form.quantity),
    fixed_cost_price: form.fixed_cost_price ? String(form.fixed_cost_price) : null,
    fixed_sale_price: form.fixed_sale_price ? String(form.fixed_sale_price) : null,
  }
  
  try {
    if (props.editingId) {
      await store.updateProjectItem(props.editingId, payload)
      emit('updated')
    } else {
      await store.createProjectItem(payload)
      emit('created')
    }
    close()
  } catch (e) {
    console.error('Failed to save item:', e)
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
  // Закрываем вложенные модалки если открыты
  showNomenclatureModal.value = false
  showFactoryModal.value = false
}
</script>

<style scoped>
/* ============================================
   ТЕМНЫЕ СТИЛИ ДЛЯ ItemFormModal
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.combobox-suggestions li:hover {
  background: rgba(201, 168, 106, 0.1);
}

.combobox-suggestions li:not(:last-child) {
  border-bottom: 1px solid rgba(208, 210, 213, 0.05);
}

.suggestion-name {
  font-weight: 500;
}

.suggestion-article {
  color: rgba(208, 210, 213, 0.4);
  font-size: 12px;
}

.suggestion-prices {
  margin-left: auto;
  font-size: 12px;
  color: rgba(208, 210, 213, 0.4);
}

/* ============================================
   КНОПКА СОЗДАНИЯ ТОВАРА
   ============================================ */
.btn-create-nomenclature {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 4px 12px;
  background: none;
  border: 1px dashed rgba(208, 210, 213, 0.3);
  border-radius: 6px;
  color: #C9A86A;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-nomenclature:hover {
  background: rgba(201, 168, 106, 0.1);
  border-color: #C9A86A;
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