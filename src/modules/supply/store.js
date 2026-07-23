import { ref } from 'vue'
import { supplyApi } from '@/modules/supply/api'

const factories = ref([])
const nomenclatures = ref([])
const loading = ref(false)
const error = ref(null)

export function useSupplyStore() {
  // --- Factories ---
  async function fetchFactories() {
    loading.value = true
    error.value = null
    try {
      const res = await supplyApi.factories.list()
      factories.value = res.data.results || res.data || []
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
    createNomenclature,
  }
}