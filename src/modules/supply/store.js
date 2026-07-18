import { ref } from 'vue'
import { supplyApi } from './api'

const factories = ref([])
const nomenclatures = ref([])
const loading = ref(false)

export function useSupplyStore() {
  async function fetchFactories() {
    loading.value = true
    try {
      const res = await supplyApi.factories.list()
      factories.value = res.data.results
    } finally {
      loading.value = false
    }
  }

  async function fetchNomenclatures() {
    loading.value = true
    try {
      const res = await supplyApi.nomenclatures.list()
      nomenclatures.value = res.data.results
    } finally {
      loading.value = false
    }
  }

  return {
    factories,
    nomenclatures,
    loading,
    fetchFactories,
    fetchNomenclatures
  }
}