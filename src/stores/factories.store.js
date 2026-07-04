import { defineStore } from 'pinia'
import {
  getFactories,
  createFactory,
  updateFactory,
  deleteFactory
} from '@/services/factories.service'

export const useFactoriesStore = defineStore('factories', {
  state: () => ({
    items: [],
    loading: false
  }),

  actions: {
    async fetchFactories() {
      this.loading = true
      try {
        this.items = await getFactories()
      } finally {
        this.loading = false
      }
    },

    async createFactory(payload) {
      await createFactory(payload)
      await this.fetchFactories()
    },

    async updateFactory(id, payload) {
      await updateFactory(id, payload)
      await this.fetchFactories()
    },

    async deleteFactory(id) {
      await deleteFactory(id)
      await this.fetchFactories()
    }
  }
})