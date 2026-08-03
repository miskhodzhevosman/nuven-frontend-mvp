// stores/groupStore.js
import { defineStore } from 'pinia'
import { userApi } from '../api'

export const useGroupStore = defineStore('groups', {
  state: () => ({
    groups: [],
    permissions: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // Группировка прав по приложениям
    permissionsByApp: (state) => {
      const grouped = {}
      state.permissions.forEach(perm => {
        const app = perm.app_label || 'other'
        if (!grouped[app]) grouped[app] = []
        grouped[app].push(perm)
      })
      return grouped
    },

    // Права для конкретной модели
    getPermissionsForModel: (state) => (model) => {
      return state.permissions.filter(p => p.model === model)
    },

    // Права для конкретного приложения
    getPermissionsForApp: (state) => (app) => {
      return state.permissions.filter(p => p.app_label === app)
    }
  },

  actions: {
    // Загрузка групп
    async fetchGroups() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.getAllGroups()
        this.groups = response.data.results || response.data
        return this.groups
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки групп'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Загрузка прав
    async fetchPermissions() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.getAllPermissions()
        this.permissions = response.data.results || response.data
        return this.permissions
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки прав'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Создание группы
    async createGroup(data) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.createGroup(data)
        this.groups.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data || 'Ошибка создания группы'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Обновление группы
    async updateGroup(id, data) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.updateGroup(id, data)
        const index = this.groups.findIndex(g => g.id === id)
        if (index !== -1) {
          this.groups[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data || 'Ошибка обновления группы'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Удаление группы
    async deleteGroup(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await userApi.deleteGroup(id)
        this.groups = this.groups.filter(g => g.id !== id)
        return { success: true }
      } catch (error) {
        this.error = error.response?.data || 'Ошибка удаления группы'
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})