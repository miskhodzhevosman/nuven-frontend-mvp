<!-- modules/supply/widgets/NomenclatureFormModal/index.vue -->

<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <h2>{{ isEdit ? 'Редактирование товара' : 'Новый товар' }}</h2>
      
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <form ref="formRef" @submit.prevent="submit">
        <!-- Основная информация -->
        <div v-show="activeTab === 'main'" class="tab-content">
          <label class="field">
            <span>Название *</span>
            <input v-model="form.name" required maxlength="255" />
          </label>
          
          <label class="field">
            <span>Техническое название</span>
            <input v-model="form.technical_name" maxlength="255" />
          </label>
          
          <label class="field">
            <span>Тип *</span>
            <select v-model="form.type">
              <option value="PRODUCT">Товар</option>
              <option value="SERVICE">Услуга</option>
            </select>
          </label>
          
          <label class="field">
            <span>Фабрика</span>
            <div class="row">
              <select v-model="form.factory">
                <option value="">— не указана —</option>
                <option v-for="f in factoriesList" :key="f.id" :value="f.id">
                  {{ f.name }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn btn-ghost" 
                @click="openFactoryModal"
              >
                + Новая фабрика
              </button>
            </div>
          </label>
          
          <label class="field">
            <span>Текущая себестоимость</span>
            <input v-model="form.current_cost_price" type="number" step="0.01" />
          </label>
          
          <label class="field">
            <span>Текущая цена продажи</span>
            <input v-model="form.current_sale_price" type="number" step="0.01" />
          </label>
        </div>
        
        <!-- Изображения -->
        <div v-show="activeTab === 'images'" class="tab-content">
          <ImageUploader
            :nomenclature-id="nomenclatureId || null"
            :images="images"
            @update:images="images = $event"
            @image-added="onImageAdded"
            @image-removed="onImageRemoved"
          />
        </div>
        
        <!-- Файлы -->
        <div v-show="activeTab === 'files'" class="tab-content">
          <FileUploader
            :nomenclature-id="nomenclatureId || null"
            :files="files"
            @update:files="files = $event"
            @file-added="onFileAdded"
            @file-removed="onFileRemoved"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ isEdit ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
    
    <!-- Вложенная модалка фабрики -->
    <FactoryFormModal 
      v-model="showFactoryModal" 
      @created="onFactoryCreated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useSupplyStore } from '../../store'
import { useProjectsStore } from '@/modules/projects/store'
import { storeToRefs } from 'pinia'
import FactoryFormModal from '../FactoryFormModal/index.vue'
import ImageUploader from '../ImageUploader/index.vue'
import FileUploader from '../FileUploader/index.vue'

const props = defineProps({
  modelValue: Boolean,
  nomenclatureId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'created', 'factory-created', 'updated'])

const supplyStore = useSupplyStore()
const projectsStore = useProjectsStore()

const { factories, loading, error } = storeToRefs(supplyStore)
const { factories: projectFactories } = storeToRefs(projectsStore)

const factoriesList = computed(() => projectFactories.value || [])

const formRef = ref(null)
const showFactoryModal = ref(false)
const activeTab = ref('main')
const images = ref([])
const files = ref([])
const isEdit = computed(() => !!props.nomenclatureId)

const tabs = [
  { key: 'main', label: 'Основное' },
  { key: 'images', label: 'Изображения' },
  { key: 'files', label: 'Файлы' }
]

const form = reactive({
  name: '',
  technical_name: '',
  type: 'PRODUCT',
  factory: '',
  current_cost_price: '',
  current_sale_price: '',
})

// Загружаем данные при редактировании
watch(() => props.nomenclatureId, async (newId) => {
  if (newId) {
    await loadNomenclatureData(newId)
  }
}, { immediate: true })

// Загружаем фабрики при открытии модалки
watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    await Promise.all([
      supplyStore.fetchFactories(),
      projectsStore.fetchFactories()
    ])
  }
}, { immediate: true })

async function loadNomenclatureData(id) {
  try {
    const data = await projectsStore.getNomenclature(id)
    form.name = data.name
    form.technical_name = data.technical_name || ''
    form.type = data.type
    form.factory = data.factory || ''
    form.current_cost_price = data.current_cost_price || ''
    form.current_sale_price = data.current_sale_price || ''
    
    if (data.images) {
      images.value = data.images.map(img => ({
        ...img,
        image_url: img.image_url || img.image
      }))
    }
    if (data.files) {
      files.value = data.files.map(f => ({
        ...f,
        file_url: f.file_url || f.file
      }))
    }
  } catch (error) {
    console.error('Failed to load nomenclature:', error)
  }
}

// modules/supply/widgets/NomenclatureFormModal/index.vue

// Замените метод submit:

async function submit() {
  if (!formRef.value?.checkValidity()) return
  
  const payload = {
    name: form.name,
    technical_name: form.technical_name || '',
    type: form.type,
    factory: form.factory ? Number(form.factory) : null,
    current_cost_price: form.current_cost_price ? String(form.current_cost_price) : null,
    current_sale_price: form.current_sale_price ? String(form.current_sale_price) : null,
  }
  
  console.log('📤 Submitting form:', payload)
  console.log('🔍 isEdit:', isEdit.value)
  console.log('🔍 nomenclatureId:', props.nomenclatureId)
  
  try {
    let result
    
    if (isEdit.value) {
      console.log('✏️ Updating nomenclature...')
      result = await projectsStore.updateNomenclature(props.nomenclatureId, payload)
      console.log('✅ Updated:', result)
      emit('updated', result)
    } else {
      console.log('➕ Creating new nomenclature...')
      result = await projectsStore.createNomenclature(payload)
      console.log('✅ Created:', result)
      const newId = result.id
      console.log('🆕 New ID:', newId)
      
      // Загружаем изображения
      if (images.value.length > 0) {
        console.log('📸 Uploading images:', images.value.length)
        for (const image of images.value) {
          if (image.file) {
            await projectsStore.uploadNomenclatureImage(
              newId,
              image.file,
              image.is_main || false,
              image.alt_text || ''
            )
          }
        }
      }
      
      // Загружаем файлы
      if (files.value.length > 0) {
        console.log('📄 Uploading files:', files.value.length)
        for (const file of files.value) {
          if (file.file) {
            await projectsStore.uploadNomenclatureFile(
              newId,
              file.file,
              file.name || '',
              file.description || ''
            )
          }
        }
      }
      
      console.log('🔄 Refreshing stores...')
      await supplyStore.fetchNomenclatures()
      await projectsStore.fetchNomenclatures()
      
      console.log('📤 Emitting created event')
      emit('created', result)
    }
    
    close()
  } catch (e) {
    console.error('❌ Failed to save nomenclature:', e)
  }
}

function openFactoryModal() {
  showFactoryModal.value = true
}

async function onFactoryCreated(factory) {
  form.factory = factory.id
  await Promise.all([
    supplyStore.fetchFactories(),
    projectsStore.fetchFactories()
  ])
  emit('factory-created', factory)
}

function onImageAdded(image) {
  images.value.push(image)
}

function onImageRemoved(image) {
  const index = images.value.findIndex(img => img.id === image.id || img.tempId === image.tempId)
  if (index > -1) {
    images.value.splice(index, 1)
  }
}

function onFileAdded(file) {
  files.value.push(file)
}

function onFileRemoved(file) {
  const index = files.value.findIndex(f => f.id === file.id || f.tempId === file.tempId)
  if (index > -1) {
    files.value.splice(index, 1)
  }
}

function close() {
  emit('update:modelValue', false)
  activeTab.value = 'main'
  Object.assign(form, {
    name: '',
    technical_name: '',
    type: 'PRODUCT',
    factory: '',
    current_cost_price: '',
    current_sale_price: '',
  })
  images.value = []
  files.value = []
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.tab-content {
  max-height: 400px;
  overflow-y: auto;
}

.field {
  display: block;
  margin-bottom: 16px;
}

.field span {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

.field input,
.field select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row select {
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-ghost:hover {
  background: #f5f5f5;
}

.alert-error {
  color: #f44336;
  font-size: 14px;
  margin-top: 8px;
}
</style>