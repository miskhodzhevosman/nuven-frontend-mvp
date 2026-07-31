// modules/supply/store/index.js

import { ref } from 'vue'
import { supplyApi } from '@/modules/supply/api'
import { defineStore } from 'pinia'

export const useSupplyStore = defineStore('supply', () => {
  // State
  const factories = ref([])
  const nomenclatures = ref([])
  const loading = ref(false)
  const error = ref(null)

  // --- Factories ---
  async function fetchFactories() {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.list()
      factories.value = res.data.results || res.data || []
      console.log('Factories loaded:', factories.value)
    } catch (e) {
      error.value = e.message
      console.error('Failed to fetch factories:', e)
    } finally {
      loading.value = false
    }
  }

  async function createFactory(data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.create(data)
      await fetchFactories()
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to create factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- Nomenclatures ---
  async function fetchNomenclatures() {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.list()
      nomenclatures.value = res.data.results || res.data || []
    } catch (e) {
      error.value = e.message
      console.error('Failed to fetch nomenclatures:', e)
    } finally {
      loading.value = false
    }
  }

  async function searchNomenclatures(query) {
    if (!query || query.trim().length < 3) {
      return []
    }
    
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.search(query.trim())
      return res.data || []
    } catch (e) {
      error.value = e.message
      console.error('Failed to search nomenclatures:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  async function createNomenclature(data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.create(data)
      await fetchNomenclatures()
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to create nomenclature:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getNomenclature(id) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.get(id)
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to get nomenclature:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- Images ---
  async function uploadImage(nomenclatureId, file, isMain = false, altText = '') {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('nomenclature', nomenclatureId)
      formData.append('image', file)
      formData.append('is_main', isMain ? 'true' : 'false')
      if (altText) formData.append('alt_text', altText)
      
      const res = await supplyApi.images.create(formData)
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to upload image:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteImage(imageId) {
    loading.value = true
    error.value = null
    try {
      await supplyApi.images.delete(imageId)
      return true
    } catch (e) {
      error.value = e.message
      console.error('Failed to delete image:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setMainImage(imageId) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.images.setMain(imageId)
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to set main image:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // --- Files ---
  async function uploadFile(nomenclatureId, file, name = '', description = '') {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('nomenclature', nomenclatureId)
      formData.append('file', file)
      if (name) formData.append('name', name)
      if (description) formData.append('description', description)
      
      const res = await supplyApi.files.create(formData)
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to upload file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteFile(fileId) {
    loading.value = true
    error.value = null
    try {
      await supplyApi.files.delete(fileId)
      return true
    } catch (e) {
      error.value = e.message
      console.error('Failed to delete file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateFile(fileId, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.files.update(fileId, data)
      return res.data
    } catch (e) {
      error.value = e.message
      console.error('Failed to update file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    factories,
    nomenclatures,
    loading,
    error,
    
    // Actions
    fetchFactories,
    createFactory,
    fetchNomenclatures,
    searchNomenclatures,
    createNomenclature,
    getNomenclature,
    
    // Images
    uploadImage,
    deleteImage,
    setMainImage,
    
    // Files
    uploadFile,
    deleteFile,
    updateFile,
  }
})