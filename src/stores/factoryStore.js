import { defineStore } from 'pinia'
import {
  getFactories,
  createFactory,
  updateFactory,
  deleteFactory
} from '@/services/supplies'

export const useSuppliesStore = defineStore('supplies', {
  state: () => ({
    factories: [],
    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    error: null
  }),

  actions: {
    async fetchFactories() {
      this.loading = true
      this.error = null

      try {
        const response = await getFactories()
        this.factories = response.data
      } catch (err) {
        this.error = err
        console.error('Ошибка загрузки factories:', err)
      } finally {
        this.loading = false
      }
    },

    async createFactory(factoryData) {
      this.createLoading = true
      this.error = null

      try {
        const response = await createFactory(factoryData)
        this.factories.push(response.data)
        return response.data
      } catch (err) {
        this.error = err
        console.error('Ошибка создания factory:', err)
        throw err
      } finally {
        this.createLoading = false
      }
    },

    async updateFactory(id, factoryData) {
      this.updateLoading = true
      this.error = null

      try {
        const response = await updateFactory(id, factoryData)

        const index = this.factories.findIndex(item => item.id === id)
        if (index !== -1) {
          this.factories[index] = response.data
        }

        return response.data
      } catch (err) {
        this.error = err
        console.error('Ошибка обновления factory:', err)
        throw err
      } finally {
        this.updateLoading = false
      }
    },

    async deleteFactory(id) {
      this.deleteLoading = true
      this.error = null

      try {
        await deleteFactory(id)
        this.factories = this.factories.filter(item => item.id !== id)
      } catch (err) {
        this.error = err
        console.error('Ошибка удаления factory:', err)
        throw err
      } finally {
        this.deleteLoading = false
      }
    }
  }
})