<!-- modules/supply/widgets/ImageUploader/index.vue -->

<template>
  <div class="image-uploader">
    <div 
      class="upload-area" 
      @dragover.prevent 
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="!uploading && images.length === 0" class="upload-placeholder">
        <div class="upload-icon">📸</div>
        <p>Перетащите изображения сюда или нажмите для выбора</p>
        <small>Поддерживаются: JPEG, PNG, GIF, WEBP</small>
      </div>
      
      <div v-else-if="uploading" class="upload-loading">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>
      
      <div v-else-if="!uploading && images.length > 0" class="upload-hint">
        <p>➕ Нажмите или перетащите для добавления</p>
      </div>
    </div>
    
    <!-- Список изображений -->
    <div v-if="images.length > 0" class="images-grid">
      <div
        v-for="(image, index) in images"
        :key="image.tempId || image.id || index"
        class="image-item"
        :class="{ 'is-main': image.is_main }"
      >
        <img :src="image.image_url || image.preview" :alt="image.alt_text || 'Изображение'" />
        
        <div class="image-overlay">
          <button
            v-if="!image.is_main"
            class="btn-icon"
            title="Сделать основным"
            @click.stop="setMain(image)"
          >
            ⭐
          </button>
          <button
            class="btn-icon danger"
            title="Удалить"
            @click.stop="removeImage(image)"
          >
            ✕
          </button>
        </div>
        
        <div v-if="image.is_main" class="main-badge">Основное</div>
        
        <input
          v-model="image.alt_text"
          class="alt-text-input"
          placeholder="Альтернативный текст"
          @click.stop
          @blur="updateAltText(image)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'

const props = defineProps({
  nomenclatureId: {
    type: Number,
    default: null
  },
  images: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:images', 'image-added', 'image-removed'])

const projectsStore = useProjectsStore()
const fileInput = ref(null)
const uploading = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  await uploadFiles(files)
  event.target.value = ''
}

async function handleDrop(event) {
  const files = Array.from(event.dataTransfer.files)
  await uploadFiles(files)
}

async function uploadFiles(files) {
  if (!props.nomenclatureId) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      
      const preview = URL.createObjectURL(file)
      const newImage = {
        file: file,
        preview: preview,
        is_main: props.images.length === 0,
        alt_text: file.name,
        tempId: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      }
      
      emit('image-added', newImage)
    }
    return
  }
  
  uploading.value = true
  
  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      
      const preview = URL.createObjectURL(file)
      
      const uploaded = await projectsStore.uploadNomenclatureImage(
        props.nomenclatureId,
        file,
        props.images.length === 0,
        file.name
      )
      
      const newImage = { ...uploaded, preview }
      emit('image-added', newImage)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}

async function setMain(image) {
  if (!image.id) {
    emit('update:images', props.images.map(img => ({
      ...img,
      is_main: img.tempId === image.tempId
    })))
    return
  }
  
  try {
    await projectsStore.setMainNomenclatureImage(image.id)
    emit('update:images', props.images.map(img => 
      img.id === image.id ? { ...img, is_main: true } : { ...img, is_main: false }
    ))
  } catch (error) {
    console.error('Failed to set main image:', error)
  }
}

async function removeImage(image) {
  if (!confirm(`Удалить изображение "${image.alt_text || image.image}"?`)) return
  
  if (!image.id) {
    if (image.preview) {
      URL.revokeObjectURL(image.preview)
    }
    emit('image-removed', image)
    return
  }
  
  try {
    await projectsStore.deleteNomenclatureImage(image.id)
    emit('image-removed', image)
    if (image.preview) {
      URL.revokeObjectURL(image.preview)
    }
  } catch (error) {
    console.error('Failed to delete image:', error)
  }
}

async function updateAltText(image) {
  if (!image.id) return
  
  try {
    await projectsStore.updateNomenclatureImage(image.id, {
      alt_text: image.alt_text
    })
  } catch (error) {
    console.error('Failed to update alt text:', error)
  }
}
</script>

<style scoped>
.image-uploader {
  margin: 16px 0;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-placeholder p {
  margin: 8px 0;
  color: #666;
}

.upload-placeholder small {
  color: #999;
}

.upload-hint {
  color: #999;
  font-size: 14px;
}

.upload-hint p {
  margin: 0;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  transition: border-color 0.3s;
  background: #fff;
}

.image-item.is-main {
  border-color: #4CAF50;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #fff;
  transform: scale(1.1);
}

.btn-icon.danger:hover {
  background: #f44336;
  color: #fff;
}

.main-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #4CAF50;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.alt-text-input {
  width: 100%;
  border: none;
  border-top: 1px solid #e0e0e0;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  background: #fafafa;
}

.alt-text-input:focus {
  background: #fff;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>