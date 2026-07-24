import { defineStore } from 'pinia'
import { userApi } from './api'

export const useUserStore = defineStore('users', {
  state: () => ({
    // Данные
    users: [],
    currentUser: null,
    selectedUser: null,
    
    // Состояние загрузки
    isLoading: false,
    isUpdating: false,
    isDeleting: false,
    
    // Ошибки
    error: null,
    validationErrors: {},
    
    // Пагинация
    pagination: {
      count: 0,
      next: null,
      previous: null,
      currentPage: 1,
      pageSize: 10
    },
    
    // Фильтры
    filters: {
      search: '',
      is_active: null,
      is_staff: null
    },
    
    // Кеш
    cache: {
      users: {},
      lastFetch: null,
      cacheDuration: 60000
    },
    
    // Последнее обновление
    lastUpdated: null
  }),

  getters: {
    // Список пользователей
    getUserList: (state) => state.users,
    
    // Текущий пользователь
    getCurrentUser: (state) => state.currentUser,
    
    // Выбранный пользователь
    getSelectedUser: (state) => state.selectedUser,
    
    // Проверка загрузки
    isLoading: (state) => state.isLoading,
    
    // Проверка ошибок
    hasError: (state) => !!state.error,
    
    // Получить ошибку
    getError: (state) => state.error,
    
    // Активные пользователи
    activeUsers: (state) => state.users.filter(u => u.is_active === true),
    
    // Неактивные пользователи
    inactiveUsers: (state) => state.users.filter(u => u.is_active === false),
    
    // Администраторы
    staffUsers: (state) => state.users.filter(u => u.is_staff === true),
    
    // Общее количество
    totalUsers: (state) => state.pagination.count || state.users.length,
    
    // Количество активных
    totalActiveUsers: (state) => state.users.filter(u => u.is_active).length,
    
    // Получить пользователя по ID
    getUserById: (state) => (id) => {
      if (state.cache.users[id]) {
        return state.cache.users[id]
      }
      return state.users.find(u => u.id === id)
    },
    
    // Является ли пользователь администратором
    isAdmin: (state) => {
      return state.currentUser?.is_staff || state.currentUser?.is_superuser || false
    },
    
    // Проверка валидности кеша
    isCacheValid: (state) => {
      if (!state.cache.lastFetch) return false
      const now = Date.now()
      return (now - state.cache.lastFetch) < state.cache.cacheDuration
    }
  },

  actions: {
    // ========================================
    // ЗАГРУЗКА ДАННЫХ
    // ========================================

    // Загрузка списка пользователей
    async fetchUsers(params = {}) {
      console.log('🔄 fetchUsers вызван')
      this.isLoading = true
      this.error = null
      
      try {
        const queryParams = {
          page: this.pagination.currentPage,
          page_size: this.pagination.pageSize,
          search: this.filters.search || undefined,
          is_active: this.filters.is_active !== null ? this.filters.is_active : undefined,
          is_staff: this.filters.is_staff !== null ? this.filters.is_staff : undefined,
          ...params
        }
        
        console.log('📤 Параметры запроса:', queryParams)
        const response = await userApi.getUsers(queryParams)
        console.log('📥 Ответ получен:', response.data)
        
        if (response.data.results) {
          this.users = response.data.results
          this.pagination = {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            currentPage: queryParams.page || 1,
            pageSize: queryParams.page_size || 10
          }
        } else {
          this.users = Array.isArray(response.data) ? response.data : []
          this.pagination.count = this.users.length
        }
        
        // Обновляем кеш
        this.cache.users = this.users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {})
        this.cache.lastFetch = Date.now()
        this.lastUpdated = new Date()
        
        console.log(`✅ Загружено ${this.users.length} пользователей`)
        return this.users
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки пользователей'
        console.error('❌ fetchUsers error:', this.error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Загрузка текущего пользователя
    async fetchCurrentUser(force = false) {
      console.log('🔄 fetchCurrentUser вызван, force:', force)
      
      if (!force && this.currentUser && this.isCacheValid) {
        console.log('📦 Использую кеш currentUser')
        return this.currentUser
      }
      
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.getCurrentUser()
        console.log('📥 currentUser получен:', response.data)
        
        this.currentUser = response.data
        
        // Обновляем в списке
        const index = this.users.findIndex(u => u.id === response.data.id)
        if (index !== -1) {
          this.users[index] = response.data
        }
        
        // Обновляем в кеше
        this.cache.users[response.data.id] = response.data
        this.cache.lastFetch = Date.now()
        this.lastUpdated = new Date()
        
        console.log(`✅ currentUser обновлен: ${this.currentUser.username}`)
        return this.currentUser
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки профиля'
        console.error('❌ fetchCurrentUser error:', this.error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Загрузка пользователя по ID
    async fetchUser(id, force = false) {
      console.log(`🔄 fetchUser вызван для ID: ${id}, force: ${force}`)
      
      if (!force && this.cache.users[id]) {
        console.log(`📦 Использую кеш для пользователя ${id}`)
        this.selectedUser = this.cache.users[id]
        return this.selectedUser
      }
      
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userApi.getUser(id)
        console.log(`📥 Пользователь ${id} получен:`, response.data)
        
        this.selectedUser = response.data
        
        // Обновляем в списке
        const index = this.users.findIndex(u => u.id === id)
        if (index !== -1) {
          this.users[index] = response.data
        }
        
        // Обновляем в кеше
        this.cache.users[id] = response.data
        this.cache.lastFetch = Date.now()
        
        console.log(`✅ Пользователь ${id} загружен`)
        return this.selectedUser
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка загрузки пользователя'
        console.error('❌ fetchUser error:', this.error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // ========================================
    // СОЗДАНИЕ И ОБНОВЛЕНИЕ
    // ========================================

    // Создание пользователя
    async createUser(userData) {
      console.log('🔄 createUser вызван')
      this.isLoading = true
      this.error = null
      this.validationErrors = {}
      
      try {
        const response = await userApi.createUser(userData)
        console.log('📥 Пользователь создан:', response.data)
        
        const newUser = response.data
        
        // Добавляем в начало списка
        this.users = [newUser, ...this.users]
        this.pagination.count += 1
        
        // Добавляем в кеш
        this.cache.users[newUser.id] = newUser
        
        console.log(`✅ Пользователь создан: ${newUser.username}`)
        return newUser
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка создания пользователя'
        
        if (error.response?.data) {
          this.validationErrors = error.response.data
          console.error('❌ Validation errors:', this.validationErrors)
        }
        
        console.error('❌ createUser error:', this.error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Обновление пользователя
    async updateUser(id, userData) {
      console.log(`🔄 updateUser вызван для ID: ${id}`)
      this.isUpdating = true
      this.error = null
      this.validationErrors = {}
      
      try {
        const response = await userApi.updateUser(id, userData)
        console.log(`📥 Пользователь ${id} обновлен:`, response.data)
        
        const updatedUser = response.data
        
        // Обновляем в списке
        const index = this.users.findIndex(u => u.id === id)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        
        // Обновляем selectedUser
        if (this.selectedUser?.id === id) {
          this.selectedUser = updatedUser
        }
        
        // Обновляем currentUser
        if (this.currentUser?.id === id) {
          this.currentUser = updatedUser
        }
        
        // Обновляем в кеше
        this.cache.users[id] = updatedUser
        this.cache.lastFetch = Date.now()
        this.lastUpdated = new Date()
        
        console.log(`✅ Пользователь ${id} обновлен`)
        return updatedUser
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка обновления пользователя'
        
        if (error.response?.data) {
          this.validationErrors = error.response.data
        }
        
        console.error('❌ updateUser error:', this.error)
        throw error
      } finally {
        this.isUpdating = false
      }
    },

    // Обновление текущего пользователя
    async updateCurrentUser(userData) {
      console.log('🔄 updateCurrentUser вызван')
      this.isUpdating = true
      this.error = null
      this.validationErrors = {}
      
      try {
        const response = await userApi.updateCurrentUser(userData)
        console.log('📥 Текущий пользователь обновлен:', response.data)
        
        const updatedUser = response.data
        
        // Обновляем currentUser
        this.currentUser = updatedUser
        
        // Обновляем в списке
        const index = this.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        
        // Обновляем в кеше
        this.cache.users[updatedUser.id] = updatedUser
        this.cache.lastFetch = Date.now()
        this.lastUpdated = new Date()
        
        console.log(`✅ Текущий пользователь обновлен`)
        return updatedUser
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка обновления профиля'
        
        if (error.response?.data) {
          this.validationErrors = error.response.data
        }
        
        console.error('❌ updateCurrentUser error:', this.error)
        throw error
      } finally {
        this.isUpdating = false
      }
    },

    // Смена пароля
    async changePassword(data) {
      console.log('🔄 changePassword вызван')
      this.isLoading = true
      this.error = null
      this.validationErrors = {}
      
      try {
        await userApi.changePassword(data)
        console.log('✅ Пароль изменен')
        
        // После смены пароля обновляем данные пользователя
        await this.fetchCurrentUser(true)
        
        return { success: true }
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка смены пароля'
        
        if (error.response?.data) {
          this.validationErrors = error.response.data
        }
        
        console.error('❌ changePassword error:', this.error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // ========================================
    // УДАЛЕНИЕ
    // ========================================

    // Удаление пользователя
    async deleteUser(id) {
      console.log(`🔄 deleteUser вызван для ID: ${id}`)
      this.isDeleting = true
      this.error = null
      
      try {
        await userApi.deleteUser(id)
        console.log(`✅ Пользователь ${id} удален`)
        
        // Удаляем из списка
        this.users = this.users.filter(u => u.id !== id)
        this.pagination.count -= 1
        
        // Удаляем из кеша
        delete this.cache.users[id]
        
        // Если это selectedUser - очищаем
        if (this.selectedUser?.id === id) {
          this.selectedUser = null
        }
        
        return { success: true }
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка удаления пользователя'
        console.error('❌ deleteUser error:', this.error)
        throw error
      } finally {
        this.isDeleting = false
      }
    },

    // Активация/деактивация пользователя
    async toggleUserActive(id, isActive) {
      console.log(`🔄 toggleUserActive вызван для ID: ${id}, isActive: ${isActive}`)
      this.isUpdating = true
      this.error = null
      
      try {
        await userApi.setUserActive(id, isActive)
        console.log(`✅ Статус пользователя ${id} изменен на ${isActive}`)
        
        // Обновляем в списке
        const user = this.users.find(u => u.id === id)
        if (user) {
          user.is_active = isActive
        }
        
        // Обновляем selectedUser
        if (this.selectedUser?.id === id) {
          this.selectedUser.is_active = isActive
        }
        
        // Обновляем currentUser
        if (this.currentUser?.id === id) {
          this.currentUser.is_active = isActive
        }
        
        // Обновляем в кеше
        if (this.cache.users[id]) {
          this.cache.users[id].is_active = isActive
        }
        
        this.cache.lastFetch = Date.now()
        this.lastUpdated = new Date()
        
        return { success: true }
        
      } catch (error) {
        this.error = error.response?.data || 'Ошибка изменения статуса'
        console.error('❌ toggleUserActive error:', this.error)
        throw error
      } finally {
        this.isUpdating = false
      }
    },

    // ========================================
    // ФИЛЬТРЫ И ПАГИНАЦИЯ
    // ========================================

    setFilters(filters) {
      console.log('🔄 setFilters:', filters)
      this.filters = { ...this.filters, ...filters }
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    clearFilters() {
      console.log('🔄 clearFilters')
      this.filters = {
        search: '',
        is_active: null,
        is_staff: null
      }
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    searchUsersByQuery(query) {
      console.log('🔄 searchUsersByQuery:', query)
      this.filters.search = query
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    setPage(page) {
      console.log('🔄 setPage:', page)
      this.pagination.currentPage = page
      this.fetchUsers()
    },

    setPageSize(size) {
      console.log('🔄 setPageSize:', size)
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // ========================================
    // ВСПОМОГАТЕЛЬНЫЕ
    // ========================================

    clearError() {
      this.error = null
      this.validationErrors = {}
    },

    clearCache() {
      console.log('🗑️ Кеш очищен')
      this.cache.users = {}
      this.cache.lastFetch = null
    },

    invalidateCache() {
      console.log('🔄 Кеш инвалидирован')
      this.cache.lastFetch = null
    },

    reset() {
      console.log('🔄 reset store')
      this.users = []
      this.currentUser = null
      this.selectedUser = null
      this.isLoading = false
      this.isUpdating = false
      this.isDeleting = false
      this.error = null
      this.validationErrors = {}
      this.pagination = {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
        pageSize: 10
      }
      this.filters = {
        search: '',
        is_active: null,
        is_staff: null
      }
      this.cache = {
        users: {},
        lastFetch: null,
        cacheDuration: 60000
      }
      this.lastUpdated = null
    },

    async refreshAll() {
      console.log('🔄 refreshAll')
      this.invalidateCache()
      await Promise.all([
        this.fetchUsers(),
        this.fetchCurrentUser(true)
      ])
      console.log('🔄 Все данные обновлены')
    }
  }
})