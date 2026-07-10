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
        this.items = await getFactories()
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
        this.items = this.items.filter(item => item.id !== id)
      } catch (error) {
        this.error = error?.message || 'Не удалось удалить фабрику'
        console.error('❌ Delete factory error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Очистка состояния
    clear() {
      this.items = []
      this.error = null
    },
  },

  getters: {
    // Получить фабрику по ID
    getFactoryById: (state) => (id) => {
      return state.items.find(item => item.id === id)
    },

    // Количество фабрик
    totalCount: (state) => state.items.length,

    // Отсортированные фабрики
    sortedItems: (state) => {
      return [...state.items].sort((a, b) => a.name.localeCompare(b.name))
    },
  },
})