// src/modules/supply/store/index.js

import { ref, computed } from 'vue'
import { supplyApi } from '@/modules/supply/api'
import { defineStore } from 'pinia'

export const useSupplyStore = defineStore('supply', () => {
  // State
  const factories = ref([])
  const nomenclatures = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Pagination state for factories
  const totalFactories = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // Getters
  const hasFactories = computed(() => factories.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalFactories.value / pageSize.value))

  // --- Factories CRUD ---
  
  /**
   * Fetch list of factories with pagination and search
   * @param {Object} params - Additional query parameters
   */
  async function fetchFactories(params = {}) {
    loading.value = true
    error.value = null
    try {
      const queryParams = {
        page: currentPage.value,
        page_size: pageSize.value,
        ...params
      }
      const res = await supplyApi.factories.list(queryParams)
      factories.value = res.data.results || res.data || []
      totalFactories.value = res.data.count || 0
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to fetch factories'
      console.error('Failed to fetch factories:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get single factory by ID
   * @param {number|string} id - Factory ID
   * @returns {Promise<Object>} Factory data
   */
  async function fetchFactory(id) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.get(id)
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to fetch factory'
      console.error('Failed to fetch factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new factory
   * @param {Object} data - Factory data { name, address, contacts }
   * @returns {Promise<Object>} Created factory
   */
  async function createFactory(data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.create(data)
      // Refresh list after creation
      await fetchFactories()
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to create factory'
      console.error('Failed to create factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing factory
   * @param {number|string} id - Factory ID
   * @param {Object} data - Updated factory data
   * @returns {Promise<Object>} Updated factory
   */
  async function updateFactory(id, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.update(id, data)
      // Update in list
      const index = factories.value.findIndex(f => f.id === id)
      if (index !== -1) {
        factories.value[index] = res.data
      }
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to update factory'
      console.error('Failed to update factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Partially update existing factory
   * @param {number|string} id - Factory ID
   * @param {Object} data - Partial factory data
   * @returns {Promise<Object>} Updated factory
   */
  async function patchFactory(id, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.patch(id, data)
      // Update in list
      const index = factories.value.findIndex(f => f.id === id)
      if (index !== -1) {
        factories.value[index] = res.data
      }
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to patch factory'
      console.error('Failed to patch factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete factory by ID
   * @param {number|string} id - Factory ID
   * @returns {Promise<boolean>} Success status
   */
  async function deleteFactory(id) {
    loading.value = true
    error.value = null
    try {
      await supplyApi.factories.delete(id)
      // Remove from list
      factories.value = factories.value.filter(f => f.id !== id)
      totalFactories.value = Math.max(0, totalFactories.value - 1)
      return true
    } catch (e) {
      error.value = e.message || 'Failed to delete factory'
      console.error('Failed to delete factory:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Set current page for pagination
   * @param {number} page - Page number
   */
  function setPage(page) {
    currentPage.value = page
  }

  /**
   * Set page size for pagination
   * @param {number} size - Items per page
   */
  function setPageSize(size) {
    pageSize.value = size
    currentPage.value = 1 // Reset to first page
  }

  /**
   * Reset factory state
   */
  function resetFactories() {
    factories.value = []
    totalFactories.value = 0
    currentPage.value = 1
    pageSize.value = 10
  }

  // --- Nomenclatures ---
  
  async function fetchNomenclatures() {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.list()
      nomenclatures.value = res.data.results || res.data || []
    } catch (e) {
      error.value = e.message || 'Failed to fetch nomenclatures'
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
      error.value = e.message || 'Failed to search nomenclatures'
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
      error.value = e.message || 'Failed to create nomenclature'
      console.error('Failed to create nomenclature:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateNomenclature(id, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.nomenclatures.update(id, data)
      // Update in list
      const index = nomenclatures.value.findIndex(n => n.id === id)
      if (index !== -1) {
        nomenclatures.value[index] = res.data
      }
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to update nomenclature'
      console.error('Failed to update nomenclature:', e)
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
      error.value = e.message || 'Failed to get nomenclature'
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
      error.value = e.message || 'Failed to upload image'
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
      error.value = e.message || 'Failed to delete image'
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
      error.value = e.message || 'Failed to set main image'
      console.error('Failed to set main image:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateNomenclatureImage(imageId, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.images.update(imageId, data)
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to update image'
      console.error('Failed to update image:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchNomenclatureImages(nomenclatureId) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.images.list({ nomenclature_id: nomenclatureId })
      return res.data?.results || res.data || []
    } catch (e) {
      error.value = e.message || 'Failed to fetch images'
      console.error('Failed to fetch images:', e)
      return []
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
      error.value = e.message || 'Failed to upload file'
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
      error.value = e.message || 'Failed to delete file'
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
      error.value = e.message || 'Failed to update file'
      console.error('Failed to update file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchNomenclatureFiles(nomenclatureId) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.files.list({ nomenclature_id: nomenclatureId })
      return res.data?.results || res.data || []
    } catch (e) {
      error.value = e.message || 'Failed to fetch files'
      console.error('Failed to fetch files:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  async function uploadFactoryFile(factoryId, file, name = '', description = '') {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('factory', factoryId)
      formData.append('file', file)
      if (name) formData.append('name', name)
      if (description) formData.append('description', description)
      
      const res = await supplyApi.factoryFiles.create(formData)
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to upload factory file'
      console.error('Failed to upload factory file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteFactoryFile(fileId) {
    loading.value = true
    error.value = null
    try {
      await supplyApi.factoryFiles.delete(fileId)
      return true
    } catch (e) {
      error.value = e.message || 'Failed to delete factory file'
      console.error('Failed to delete factory file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateFactoryFile(fileId, data) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factoryFiles.update(fileId, data)
      return res.data
    } catch (e) {
      error.value = e.message || 'Failed to update factory file'
      console.error('Failed to update factory file:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchFactoryFiles(factoryId) {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factoryFiles.list({ factory_id: factoryId })
      return res.data?.results || res.data || []
    } catch (e) {
      error.value = e.message || 'Failed to fetch factory files'
      console.error('Failed to fetch factory files:', e)
      return []
    } finally {
      loading.value = false
    }
  }


  // Clear error
  function clearError() {
    error.value = null
  }

  return {
    // State
    factories,
    nomenclatures,
    loading,
    error,
    totalFactories,
    currentPage,
    pageSize,
    
    // Getters
    hasFactories,
    totalPages,
    
    // Factory actions
    fetchFactories,
    fetchFactory,
    createFactory,
    updateFactory,
    patchFactory,
    deleteFactory,
    setPage,
    setPageSize,
    resetFactories,
    clearError,
    
    // Nomenclature actions
    fetchNomenclatures,
    searchNomenclatures,
    createNomenclature,
    updateNomenclature,
    getNomenclature,


    uploadFactoryFile,
    deleteFactoryFile,
    updateFactoryFile,
    fetchFactoryFiles,
    
    // Image actions
    uploadImage,
    deleteImage,
    setMainImage,
    updateNomenclatureImage,
    fetchNomenclatureImages,
    
    // File actions
    uploadFile,
    deleteFile,
    updateFile,
    fetchNomenclatureFiles,
  }
})