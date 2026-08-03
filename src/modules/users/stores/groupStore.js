// stores/groupStore.js
import { defineStore } from 'pinia'
import { userApi } from '../api'

export const useGroupStore = defineStore('groups', {
  state: () => ({
    groups: [],
    isLoading: false,
    error: null
  }),

  getters: {
    getGroupById: (state) => (id) => {
      return state.groups.find(g => g.id === id)
    },
    
    getGroupNames: (state) => {
      return state.groups.map(g => g.name)
    }
  },

  actions: {
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
    
    // Добавляем метод для получения групп с количеством пользователей
    async fetchGroupsWithCounts() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.getAllGroups()
        const groups = response.data.results || response.data
        
        // Для каждой группы получаем количество пользователей
        const groupsWithCounts = await Promise.all(
          groups.map(async (group) => {
            try {
              const usersResponse = await userApi.getUsers({ 
                group: group.name,
                page_size: 1 
              })
              return {
                ...group,
                user_count: usersResponse.data.count || 0
              }
            } catch {
              return {
                ...group,
                user_count: 0
              }
            }
          })
        )
        
        this.groups = groupsWithCounts
        return this.groups
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки групп'
        throw error
      } finally {
        this.isLoading = false
      }
    },


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
    },
    async updateUserGroups(userId, groupIds) {
      console.log(`🔄 updateUserGroups вызван для пользователя ${userId}`, groupIds)
      this.isUpdating = true
      this.error = null
      
      try {
        // Используем метод manage_groups с PUT
        const response = await userApi.setUserGroups(userId, groupIds)
        console.log(`✅ Группы пользователя ${userId} обновлены:`, response.data)
        
        // Обновляем пользователя в списке
        const user = this.users.find(u => u.id === userId)
        if (user) {
          // Получаем имена групп
          const groupNames = response.data.map(g => g.name) || []
          user.groups = groupNames
          // Если есть groups_detail, тоже обновляем
          if (user.groups_detail) {
            user.groups_detail = response.data
          }
        }
        
        // Обновляем в кеше
        if (this.cache.users[userId]) {
          const groupNames = response.data.map(g => g.name) || []
          this.cache.users[userId].groups = groupNames
          if (this.cache.users[userId].groups_detail) {
            this.cache.users[userId].groups_detail = response.data
          }
        }
        
        return response.data
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка обновления групп'
        console.error('❌ updateUserGroups error:', this.error)
        throw error
      } finally {
        this.isUpdating = false
      }
    }
  
  }
})