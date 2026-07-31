<!-- modules/supply/widgets/NomenclatureDetailModal/index.vue -->

<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ nomenclature?.name || 'Товар' }}</h2>
        <button class="btn-icon close-btn" @click="close">✕</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="!nomenclature" class="empty-state">
        <p>Товар не найден</p>
      </div>

      <div v-else class="modal-body">
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

        <!-- Основная информация -->
        <div v-show="activeTab === 'main'" class="tab-content">
          <div class="info-grid">
            <div class="info-item">
              <label>Название</label>
              <p>{{ nomenclature.name }}</p>
            </div>
            <div class="info-item">
              <label>Техническое название</label>
              <p>{{ nomenclature.technical_name || '—' }}</p>
            </div>
            <div class="info-item">
              <label>Тип</label>
              <p>{{ nomenclature.type === 'PRODUCT' ? 'Товар' : 'Услуга' }}</p>
            </div>
            <div class="info-item">
              <label>Артикул</label>
              <p>{{ nomenclature.article || '—' }}</p>
            </div>
            <div class="info-item">
              <label>Фабрика</label>
              <p>{{ factoryName || '—' }}</p>
            </div>
            <div class="info-item">
              <label>Себестоимость</label>
              <p>{{ formatPrice(nomenclature.current_cost_price) }}</p>
            </div>
            <div class="info-item">
              <label>Цена продажи</label>
              <p>{{ formatPrice(nomenclature.current_sale_price) }}</p>
            </div>
            <div class="info-item">
              <label>Дата создания</label>
              <p>{{ formatDate(nomenclature.created_at) }}</p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-primary" @click="openEdit">Редактировать</button>
          </div>
        </div>

        <!-- Изображения - используем компонент -->
        <div v-show="activeTab === 'images'" class="tab-content">
          <ImageUploader
            :nomenclature-id="nomenclature?.id"
            :images="images"
            @update:images="images = $event"
            @image-added="onImageAdded"
            @image-removed="onImageRemoved"
          />
        </div>

        <!-- Файлы - используем компонент -->
        <div v-show="activeTab === 'files'" class="tab-content">
          <FileUploader
            :nomenclature-id="nomenclature?.id"
            :files="files"
            @update:files="files = $event"
            @file-added="onFileAdded"
            @file-removed="onFileRemoved"
          />
        </div>
      </div>
    </div>

    <!-- Модалка редактирования -->
    <NomenclatureFormModal
      v-model="showEditModal"
      :nomenclature-id="nomenclature?.id"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { useSupplyStore } from '../../store'
import { storeToRefs } from 'pinia'
import NomenclatureFormModal from '../NomenclatureFormModal/index.vue'
import ImageUploader from '../ImageUploader/index.vue'
import FileUploader from '../FileUploader/index.vue'

const props = defineProps({
  modelValue: Boolean,
  nomenclatureId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const projectsStore = useProjectsStore()
const supplyStore = useSupplyStore()
const { factories } = storeToRefs(projectsStore)

const loading = ref(false)
const nomenclature = ref(null)
const images = ref([])
const files = ref([])
const activeTab = ref('main')
const showEditModal = ref(false)

const tabs = computed(() => [
  { key: 'main', label: 'Основное' },
  { key: 'images', label: `Изображения (${images.value.length})` },
  { key: 'files', label: `Файлы (${files.value.length})` }
])

const factoryName = computed(() => {
  if (!nomenclature.value?.factory) return null
  const factory = factories.value.find(f => f.id === nomenclature.value.factory)
  return factory?.name || null
})

// Загружаем данные при открытии
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.nomenclatureId) {
    await loadData()
    await loadImages()
    await loadFiles()
  }
}, { immediate: true })

async function loadData() {
  if (!props.nomenclatureId) return
  
  loading.value = true
  try {
    const data = await projectsStore.getNomenclature(props.nomenclatureId)
    nomenclature.value = data
  } catch (error) {
    console.error('Failed to load nomenclature:', error)
  } finally {
    loading.value = false
  }
}

async function loadImages() {
  if (!props.nomenclatureId) return
  
  try {
    const response = await supplyStore.fetchNomenclatureImages(props.nomenclatureId)
    images.value = response || []
  } catch (error) {
    console.error('Failed to load images:', error)
  }
}

async function loadFiles() {
  if (!props.nomenclatureId) return
  
  try {
    const response = await supplyStore.fetchNomenclatureFiles(props.nomenclatureId)
    files.value = response || []
  } catch (error) {
    console.error('Failed to load files:', error)
  }
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

function openEdit() {
  showEditModal.value = true
}

async function onUpdated() {
  await loadData()
  await loadImages()
  await loadFiles()
  emit('updated')
  showEditModal.value = false
}

function close() {
  emit('update:modelValue', false)
  activeTab.value = 'main'
  nomenclature.value = null
  images.value = []
  files.value = []
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  return Number.isFinite(num) ? num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : '—'
}

function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  z-index: 2000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
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

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item p {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
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

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
}

.loading-state {
  padding: 40px;
  text-align: center;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

