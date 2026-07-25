import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'

// Глобальные счетчики
let instanceCount = 0
let loginCalls = 0
let logoutCalls = 0
let refreshTokenCalls = 0
let checkAuthCalls = 0
let scheduleTokenRefreshCalls = 0

// Глобальное состояние (чтобы не создавать множество экземпляров)
const user = ref(null)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))
let refreshTimeout = null
let isRefreshing = false
let globalInstance = null

// Функция для получения имени компонента из стека вызовов
function getCallerInfo() {
  try {
    const stack = new Error().stack
    const lines = stack.split('\n')
    
    // Ищем вызов из компонента
    for (let i = 3; i < Math.min(lines.length, 20); i++) {
      const line = lines[i]
      
      // Ищем .vue файлы
      const vueMatch = line.match(/\((.+\.vue):\d+:\d+\)/)
      if (vueMatch) {
        const path = vueMatch[1]
        return path.split('/').pop()
      }
      
      // Ищем компоненты в стеке
      const componentMatch = line.match(/at\s+(\w+)\s*\(/)
      if (componentMatch && !componentMatch[1].includes('auth')) {
        return componentMatch[1]
      }
    }
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export function useAuth() {
  // Если уже есть глобальный экземпляр - возвращаем его
  if (globalInstance) {
    console.log(`♻️ [useAuth] Используем существующий экземпляр #${instanceCount}`)
    return globalInstance
  }

  // Создаем новый экземпляр только один раз
  instanceCount++
  const instanceId = instanceCount
  console.log(`🔵 [useAuth] СОЗДАН НОВЫЙ ЭКЗЕМПЛЯР #${instanceId}`)
  console.log(`📊 [useAuth] Текущее состояние: isAuthenticated=${isAuthenticated.value}, token=${!!localStorage.getItem('access_token')}`)
  
  const router = useRouter()

  // Функция для установки таймера обновления токена
  function scheduleTokenRefresh(expiresIn) {
    scheduleTokenRefreshCalls++
    const caller = getCallerInfo()
    console.log(`⏰ [scheduleTokenRefresh] #${scheduleTokenRefreshCalls} вызвана из ${caller}, expiresIn=${expiresIn}с`)
    
    // Очищаем старый таймер
    if (refreshTimeout) {
      console.log(`🧹 [scheduleTokenRefresh] Очищаем старый таймер #${refreshTimeout}`)
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }

    // Обновляем за 5 минут до истечения
    const refreshTime = Math.max(expiresIn - 300, 60) // минимум 1 минута
    console.log(`🔄 [scheduleTokenRefresh] Токен обновится через ${Math.round(refreshTime / 60)} минут (${refreshTime}с)`)

    refreshTimeout = setTimeout(async () => {
      console.log(`⏰ [scheduleTokenRefresh] ТАЙМЕР СРАБОТАЛ! Обновление токена...`)
      try {
        await refreshToken()
      } catch (error) {
        console.error(`❌ [scheduleTokenRefresh] Не удалось обновить токен:`, error)
        logout()
      }
    }, refreshTime * 1000)
    
    console.log(`✅ [scheduleTokenRefresh] Таймер установлен #${refreshTimeout}`)
  }

  // Функция обновления токена
  async function refreshToken() {
    refreshTokenCalls++
    const caller = getCallerInfo()
    console.log(`🔄 [refreshToken] #${refreshTokenCalls} вызвана из ${caller}`)
    console.log(`📊 [refreshToken] Текущее состояние: isRefreshing=${isRefreshing}, hasToken=${!!localStorage.getItem('access_token')}`)
    
    // Если уже идет обновление - пропускаем
    if (isRefreshing) {
      console.warn(`⚠️ [refreshToken] Уже идет обновление, пропускаем вызов #${refreshTokenCalls}`)
      return
    }

    isRefreshing = true
    
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token')
      if (!refreshTokenValue) {
        console.error(`❌ [refreshToken] Нет refresh токена в localStorage`)
        throw new Error('Нет refresh токена')
      }
      console.log(`📤 [refreshToken] Отправка запроса на обновление...`)

      const response = await authApi.refreshToken({ refresh: refreshTokenValue })
      
      console.log(`✅ [refreshToken] Получен ответ:`, {
        hasAccess: !!response.data.access,
        hasRefresh: !!response.data.refresh
      })
      
      // Сохраняем новый access_token
      localStorage.setItem('access_token', response.data.access)
      console.log(`💾 [refreshToken] Сохранен новый access_token`)
      
      // Если пришел новый refresh_token - сохраняем
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
        console.log(`💾 [refreshToken] Сохранен новый refresh_token`)
      }

      isAuthenticated.value = true
      
      // Планируем следующее обновление
      const expiresIn = response.data.expires_in || 15 * 60 // 15 минут
      console.log(`📅 [refreshToken] Токен истекает через ${Math.round(expiresIn / 60)} минут`)
      scheduleTokenRefresh(expiresIn)
      
      console.log(`✅ [refreshToken] Токен успешно обновлен #${refreshTokenCalls}`)
      return response.data
    } catch (error) {
      console.error(`❌ [refreshToken] ОШИБКА #${refreshTokenCalls}:`, error.message)
      throw error
    } finally {
      isRefreshing = false
      console.log(`🔓 [refreshToken] isRefreshing сброшен в false`)
    }
  }

  // Функция входа
  async function login(username, password) {
    loginCalls++
    const caller = getCallerInfo()
    console.log(`🔐 [login] #${loginCalls} вызвана из ${caller}`)
    console.log(`📊 [login] username: ${username}, isAuthenticated: ${isAuthenticated.value}`)
    
    try {
      console.log(`📤 [login] Отправка запроса на вход...`)
      const response = await authApi.login({ 
        username: username, 
        password: password 
      })
      
      console.log(`✅ [login] Получен ответ:`, {
        hasAccess: !!response.data.access,
        hasRefresh: !!response.data.refresh
      })
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      console.log(`💾 [login] Токены сохранены`)
      
      isAuthenticated.value = true
      user.value = response.data.user || { username }
      console.log(`👤 [login] Пользователь:`, user.value)
      
      // Планируем автоматическое обновление
      const expiresIn = 4 * 60 // 4 минуты
      console.log(`📅 [login] Планируем обновление через ${expiresIn / 60} минут`)
      scheduleTokenRefresh(expiresIn)
      
      console.log(`✅ [login] Вход выполнен успешно #${loginCalls}`)
      router.push('/main')
      
      return true
    } catch (error) {
      console.error(`❌ [login] ОШИБКА #${loginCalls}:`, error.message)
      throw error
    }
  }

  // Функция выхода
  function logout() {
    logoutCalls++
    const caller = getCallerInfo()
    console.log(`🚪 [logout] #${logoutCalls} вызвана из ${caller}`)
    console.log(`📊 [logout] Текущее состояние: isAuthenticated=${isAuthenticated.value}`)
    
    // Очищаем таймер
    if (refreshTimeout) {
      console.log(`🧹 [logout] Очищаем таймер #${refreshTimeout}`)
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    console.log(`🗑️ [logout] Токены удалены`)
    
    isAuthenticated.value = false
    user.value = null
    console.log(`👤 [logout] Пользователь очищен`)
    
    console.log(`✅ [logout] Выход выполнен #${logoutCalls}`)
    router.push('/login')
  }

  // Проверка токена при загрузке
  async function checkAuth() {
    checkAuthCalls++
    const caller = getCallerInfo()
    console.log(`🔍 [checkAuth] #${checkAuthCalls} вызвана из ${caller}`)
    console.log(`📊 [checkAuth] Текущее состояние: isAuthenticated=${isAuthenticated.value}, hasToken=${!!localStorage.getItem('access_token')}`)
    
    const token = localStorage.getItem('access_token')
    if (token) {
      console.log(`✅ [checkAuth] Токен найден, пробуем обновить...`)
      try {
        await refreshToken()
        console.log(`✅ [checkAuth] Токен валидный #${checkAuthCalls}`)
        return true
      } catch (error) {
        console.warn(`⚠️ [checkAuth] Токен невалидный, выход... #${checkAuthCalls}`)
        logout()
        return false
      }
    }
    
    console.log(`❌ [checkAuth] Токен не найден #${checkAuthCalls}`)
    return false
  }

  // Создаем экземпляр
  const instance = {
    user,
    isAuthenticated: computed(() => isAuthenticated.value),
    login,
    logout,
    refreshToken,
    checkAuth,
    // Для отладки
    __debug: {
      instanceId,
      loginCalls,
      logoutCalls,
      refreshTokenCalls,
      checkAuthCalls,
      scheduleTokenRefreshCalls,
      isRefreshing: () => isRefreshing,
      refreshTimeout: () => refreshTimeout,
      getStats: () => ({
        instanceId,
        loginCalls,
        logoutCalls,
        refreshTokenCalls,
        checkAuthCalls,
        scheduleTokenRefreshCalls,
        isAuthenticated: isAuthenticated.value,
        hasAccessToken: !!localStorage.getItem('access_token'),
        hasRefreshToken: !!localStorage.getItem('refresh_token'),
        hasTimer: !!refreshTimeout
      })
    }
  }
  
  // Сохраняем глобальный экземпляр
  globalInstance = instance
  console.log(`✅ [useAuth] Экземпляр #${instanceId} сохранен как глобальный`)
  
  // Возвращаем экземпляр
  return instance
}

// Экспортируем для отладки из консоли
if (typeof window !== 'undefined') {
  window.__authDebug = {
    getStats: () => globalInstance?.__debug?.getStats(),
    getInstance: () => globalInstance,
    clearTimer: () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
        refreshTimeout = null
        console.log('🧹 Таймер очищен вручную')
      }
    }
  }
  console.log('🔍 Для отладки auth используйте: window.__authDebug.getStats()')
}