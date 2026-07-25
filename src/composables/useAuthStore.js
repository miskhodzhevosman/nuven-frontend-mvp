// composables/useAuthStore.js
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import api from './useApi'

// Глобальное состояние (синглтон)
const state = {
  user: ref(null),
  isAuthenticated: ref(!!localStorage.getItem('access_token')),
  refreshTimer: null,
  isRefreshing: false
}

// Конфигурация
const ACCESS_TOKEN_LIFETIME = 15 * 60 * 1000
const REFRESH_THRESHOLD = 5 * 60 * 1000

// Вспомогательные функции
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function getTokenExpiration(token) {
  const decoded = decodeToken(token)
  return decoded?.exp ? decoded.exp * 1000 : null
}

function isTokenExpired(token) {
  const expTime = getTokenExpiration(token)
  return !expTime || Date.now() >= expTime
}

function getTimeUntilExpiry(token) {
  const expTime = getTokenExpiration(token)
  return expTime ? expTime - Date.now() : 0
}

// Глобальные функции
async function refreshToken() {
  if (state.isRefreshing) {
    // Если уже обновляется, ждем
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!state.isRefreshing) {
          clearInterval(checkInterval)
          const token = localStorage.getItem('access_token')
          if (token) {
            resolve(token)
          } else {
            reject(new Error('Refresh failed'))
          }
        }
      }, 100)
    })
  }

  state.isRefreshing = true
  
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token')
    if (!refreshTokenValue) {
      throw new Error('No refresh token')
    }

    if (isTokenExpired(refreshTokenValue)) {
      throw new Error('Refresh token expired')
    }

    const response = await authApi.refreshToken({ refresh: refreshTokenValue })
    
    localStorage.setItem('access_token', response.data.access)
    
    if (response.data.refresh) {
      localStorage.setItem('refresh_token', response.data.refresh)
    }

    state.isAuthenticated.value = true
    scheduleRefresh()
    
    return response.data.access
  } catch (error) {
    logout()
    throw error
  } finally {
    state.isRefreshing = false
  }
}

function scheduleRefresh() {
  // Очищаем старый таймер
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer)
    state.refreshTimer = null
  }

  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) return

  const timeUntilExpiry = getTimeUntilExpiry(accessToken)
  
  if (timeUntilExpiry <= 0) {
    refreshToken().catch(() => logout())
    return
  }

  const timeUntilRefresh = Math.max(timeUntilExpiry - REFRESH_THRESHOLD, 1000)
  
  state.refreshTimer = setTimeout(() => {
    refreshToken().catch(() => logout())
  }, timeUntilRefresh)
}

function logout() {
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer)
    state.refreshTimer = null
  }
  
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  state.isAuthenticated.value = false
  state.user.value = null
  
  // Оповещаем все компоненты
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

async function checkAuth() {
  const accessToken = localStorage.getItem('access_token')
  const refreshTokenValue = localStorage.getItem('refresh_token')
  
  if (!accessToken || !refreshTokenValue) {
    state.isAuthenticated.value = false
    return false
  }

  if (isTokenExpired(accessToken)) {
    try {
      await refreshToken()
      state.isAuthenticated.value = true
      return true
    } catch {
      logout()
      return false
    }
  }

  state.isAuthenticated.value = true
  scheduleRefresh()
  return true
}

// Экспортируем глобальный composable
export function useAuth() {
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    
    login: async (username, password) => {
      try {
        const response = await authApi.login({ username, password })
        
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
        
        state.isAuthenticated.value = true
        state.user.value = response.data.user || { username }
        
        scheduleRefresh()
        return true
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    
    logout,
    refreshToken,
    checkAuth,
    isTokenExpired,
    getTimeUntilExpiry
  }
}

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  // Автоматическая проверка при загрузке приложения
  setTimeout(() => checkAuth(), 0)
}