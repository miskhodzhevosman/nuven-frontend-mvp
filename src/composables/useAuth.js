// composables/useAuth.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'

// ✅ ГЛОБАЛЬНЫЙ СЧЕТЧИК ВЫЗОВОВ
let instanceCount = 0
let refreshCallCount = 0
let timerCount = 0

const user = ref(null)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))
let refreshTimer = null

export function useAuth() {
  // ✅ Увеличиваем счетчик при каждом создании
  instanceCount++
  const instanceId = instanceCount
  console.log(`🔵 useAuth() создан #${instanceId}`)
  console.trace(`📍 Стек создания #${instanceId}`)

  const router = useRouter()

  function decodeToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload
    } catch (e) {
      return null
    }
  }

  function getTokenExpiration(token) {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return null
    return decoded.exp * 1000
  }

// composables/useAuth.js
function scheduleTokenRefresh() {
  timerCount++
  console.log(`⏱️ scheduleTokenRefresh() вызван #${timerCount}`)

  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) return

  const expTime = getTokenExpiration(accessToken)
  if (!expTime) return

  const now = Date.now()
  const timeUntilExpiry = expTime - now
  
  if (timeUntilExpiry <= 0) {
    refreshToken().catch(() => logout())
    return
  }

  // ✅ ОБНОВЛЯЕМ РАЗ В ДЕНЬ (24 часа)
  const ONE_DAY = 24 * 60 * 60 * 1000
  let timeUntilRefresh = Math.min(
    Math.max(timeUntilExpiry - 5 * 60 * 1000, 30 * 1000),
    ONE_DAY // Максимум 24 часа
  )
  
  console.log(`📅 Токен истекает через ${Math.round(timeUntilExpiry / 60000)} минут`)
  console.log(`📅 Обновление через ${Math.round(timeUntilRefresh / 60000)} минут`)

  refreshTimer = setTimeout(async () => {
    console.log(`🔄 Обновление токена...`)
    try {
      await refreshToken()
    } catch (error) {
      console.error(`❌ Не удалось обновить токен:`, error)
      logout()
    }
  }, timeUntilRefresh)
}
  async function refreshToken() {
    // ✅ Счетчик вызовов refreshToken
    refreshCallCount++
    console.log(`🔄 refreshToken() вызван #${refreshCallCount} из экземпляра #${instanceId}`)
    
    if (refreshCallCount > 10) {
      console.error(`🚨 СЛИШКОМ МНОГО ВЫЗОВОВ refreshToken! #${refreshCallCount}`)
      console.trace('📚 Стек вызовов:')
    }

    try {
      const refreshTokenValue = localStorage.getItem('refresh_token')
      if (!refreshTokenValue) {
        throw new Error('Нет refresh токена')
      }

      console.log(`📤 #${instanceId}: Отправка запроса на обновление...`)
      const response = await authApi.refreshToken({ 
        refresh: refreshTokenValue 
      })
      
      localStorage.setItem('access_token', response.data.access)
      
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }

      isAuthenticated.value = true
      
      scheduleTokenRefresh()
      
      console.log(`✅ #${instanceId}: Токен обновлен`)
      return response.data
    } catch (error) {
      console.error(`❌ #${instanceId}: Ошибка обновления токена:`, error)
      throw error
    }
  }

  async function login(username, password) {
    console.log(`🔐 #${instanceId}: login() вызван`)
    try {
      const response = await authApi.login({ username, password })
      
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      isAuthenticated.value = true
      user.value = response.data.user || { username }
      
      scheduleTokenRefresh()
      
      await router.push('/main')
      
      return true
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  function logout() {
    console.log(`🚪 #${instanceId}: logout() вызван`)
    if (refreshTimer) {
      console.log(`🧹 #${instanceId}: Очищаю таймер`, refreshTimer)
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    isAuthenticated.value = false
    user.value = null
    
    window.dispatchEvent(new Event('auth:logout'))
    router.push('/login')
  }

  async function checkAuth() {
    console.log(`🔍 #${instanceId}: checkAuth() вызван`)
    const token = localStorage.getItem('access_token')
    const refreshTokenValue = localStorage.getItem('refresh_token')
    
    if (!token || !refreshTokenValue) {
      isAuthenticated.value = false
      return false
    }

    const expTime = getTokenExpiration(token)
    if (expTime && Date.now() >= expTime) {
      try {
        await refreshToken()
        isAuthenticated.value = true
        return true
      } catch (error) {
        logout()
        return false
      }
    }

    isAuthenticated.value = true
    scheduleTokenRefresh()
    return true
  }

  const handleLogoutEvent = () => {
    console.log(`📢 #${instanceId}: Получен auth:logout`)
    logout()
  }

  onMounted(() => {
    console.log(`🔌 #${instanceId}: onMounted()`)
    window.addEventListener('auth:logout', handleLogoutEvent)
    
    if (localStorage.getItem('access_token')) {
      checkAuth()
    }
  })

  onUnmounted(() => {
    console.log(`🔌 #${instanceId}: onUnmounted()`)
    window.removeEventListener('auth:logout', handleLogoutEvent)
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  })

  return {
    user: computed(() => {
      // ✅ Логируем каждый доступ к user
      console.log(`👤 #${instanceId}: доступ к user`)
      return user.value
    }),
    isAuthenticated: computed(() => {
      // ✅ Логируем каждый доступ к isAuthenticated
      console.log(`🔑 #${instanceId}: доступ к isAuthenticated = ${isAuthenticated.value}`)
      return isAuthenticated.value
    }),
    login,
    logout,
    refreshToken,
    checkAuth
  }
}