// src/stores/factories.store.js
import { defineStore } from 'pinia'
import {
  getFactories,
  createFactory,
  updateFactory,
  deleteFactory,
} from '@/api/factories'

export const useFactoriesStore = defineStore('factories', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    saving: false,
  }),

  actions: {
    async fetchFactories() {
      this.loading = true
      this.error = null

      try {
        const response = await getFactories()
        console.log('🔍 Raw API response:', response) // ОТЛАДКА
        
        // ТАКАЯ ЖЕ ОБРАБОТКА КАК ВО ВЬЮХЕ
        if (Array.isArray(response)) {
          this.items = response
        } else if (response && typeof response === 'object') {
          this.items = response.items || response.results || []
        } else {
          this.items = []
        }
        
        console.log('✅ Processed items:', this.items) // ОТЛАДКА
        return this.items
      } catch (error) {
        this.error = error?.message || 'Не удалось загрузить фабрики'
        console.error('❌ Fetch factories error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createFactory(payload) {
      this.saving = true
      this.error = null

      try {
        const created = await createFactory(payload)
        if (!Array.isArray(this.items)) {
          this.items = []
        }
        this.items.push(created)
        return created
      } catch (error) {
        this.error = error?.message || 'Не удалось создать фабрику'
        console.error('❌ Create factory error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateFactory(id, payload) {
      this.saving = true
      this.error = null

      try {
        const updated = await updateFactory(id, payload)
        if (!Array.isArray(this.items)) {
          this.items = []
        }
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updated
        }
        return updated
      } catch (error) {
        this.error = error?.message || 'Не удалось обновить фабрику'
        console.error('❌ Update factory error:', error)
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteFactory(id) {
      this.loading = true
      this.error = null

      try {
        await deleteFactory(id)
        if (!Array.isArray(this.items)) {
          this.items = []
        }
        this.items = this.items.filter(item => item.id !== id)
      } catch (error) {
        this.error = error?.message || 'Не удалось удалить фабрику'
        console.error('❌ Delete factory error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.items = []
      this.error = null
    },
  },

  getters: {
    getFactoryById: (state) => (id) => {
      if (!Array.isArray(state.items)) {
        return undefined
      }
      return state.items.find(item => item.id === id)
    },

    totalCount: (state) => {
      if (!Array.isArray(state.items)) {
        return 0
      }
      return state.items.length
    },

    sortedItems: (state) => {
      if (!Array.isArray(state.items)) {
        return []
      }
      return [...state.items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    },
  },
})