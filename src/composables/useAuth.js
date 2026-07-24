// composables/useAuth.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'

const user = ref(null)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))
let refreshTimer = null
let tokenCheckTimer = null

export function useAuth() {
  const router = useRouter()

  // Декодирование JWT токена
  function decodeToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload
    } catch (e) {
      return null
    }
  }

  // Получение времени истечения токена
  function getTokenExpiration(token) {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return null
    return decoded.exp * 1000 // конвертируем в миллисекунды
  }

  // Проверка, истек ли токен
  function isTokenExpired(token) {
    const exp = getTokenExpiration(token)
    if (!exp) return true
    return Date.now() >= exp
  }

  // Планирование обновления токена
  function scheduleTokenRefresh() {
    // Очищаем старые таймеры
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    if (tokenCheckTimer) {
      clearInterval(tokenCheckTimer)
      tokenCheckTimer = null
    }

    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return

    const expTime = getTokenExpiration(accessToken)
    if (!expTime) return

    const now = Date.now()
    const timeUntilExpiry = expTime - now
    const timeUntilRefresh = Math.max(timeUntilExpiry - 60000, 10000) // за 1 минуту до истечения, минимум 10 сек

    console.log(`⏰ Токен истекает через ${Math.round(timeUntilExpiry / 60000)} минут`)
    console.log(`🔄 Обновление запланировано через ${Math.round(timeUntilRefresh / 1000)} секунд`)

    // Таймер для обновления
    refreshTimer = setTimeout(async () => {
      console.log('🔄 Выполняю плановое обновление токена...')
      try {
        await refreshToken()
      } catch (error) {
        console.error('❌ Плановое обновление токена не удалось:', error)
        // Если не удалось обновить - выходим
        logout()
      }
    }, timeUntilRefresh)

    // Проверка каждую минуту (на случай, если таймер сбросился)
    tokenCheckTimer = setInterval(() => {
      const token = localStorage.getItem('access_token')
      if (token && isTokenExpired(token)) {
        console.log('⚠️ Токен истек, выполняю обновление...')
        refreshToken().catch(() => logout())
      }
    }, 60000)
  }

  // Функция обновления токена
  async function refreshToken() {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token')
      if (!refreshTokenValue) {
        throw new Error('Нет refresh токена')
      }

      const response = await authApi.refreshToken({ 
        refresh: refreshTokenValue 
      })
      
      // Сохраняем новый access_token
      localStorage.setItem('access_token', response.data.access)
      
      // Если пришел новый refresh_token - сохраняем
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }

      isAuthenticated.value = true
      
      // Планируем следующее обновление
      scheduleTokenRefresh()
      
      console.log('✅ Токен успешно обновлен')
      return response.data
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error)
      throw error
    }
  }

  // Функция входа
  async function login(username, password) {
    try {
      const response = await authApi.login({ 
        username, 
        password 
      })
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      isAuthenticated.value = true
      user.value = response.data.user || { username }
      
      // Планируем автоматическое обновление
      scheduleTokenRefresh()
      
      await router.push('/main')
      
      return true
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  // Функция выхода
  function logout() {
    // Очищаем таймеры
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    if (tokenCheckTimer) {
      clearInterval(tokenCheckTimer)
      tokenCheckTimer = null
    }
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    isAuthenticated.value = false
    user.value = null
    
    // Триггерим событие для других компонентов
    window.dispatchEvent(new Event('auth:logout'))
    
    router.push('/login')
  }

  // Проверка валидности токена при загрузке
  async function checkAuth() {
    const token = localStorage.getItem('access_token')
    const refreshTokenValue = localStorage.getItem('refresh_token')
    
    if (!token || !refreshTokenValue) {
      isAuthenticated.value = false
      return false
    }

    try {
      // Пытаемся обновить токен
      await refreshToken()
      isAuthenticated.value = true
      return true
    } catch (error) {
      // Если не удалось - пробуем получить данные пользователя
      try {
        const response = await authApi.me()
        isAuthenticated.value = true
        user.value = response.data
        scheduleTokenRefresh()
        return true
      } catch (meError) {
        console.warn('❌ Проверка авторизации не удалась')
        logout()
        return false
      }
    }
  }

  // Слушатель события выхода
  const handleLogoutEvent = () => {
    logout()
  }

  // Инициализация при монтировании
  onMounted(() => {
    window.addEventListener('auth:logout', handleLogoutEvent)
    
    if (localStorage.getItem('access_token')) {
      checkAuth()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('auth:logout', handleLogoutEvent)
    if (refreshTimer) clearTimeout(refreshTimer)
    if (tokenCheckTimer) clearInterval(tokenCheckTimer)
  })

  return {
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    login,
    logout,
    refreshToken,
    checkAuth
  }
}