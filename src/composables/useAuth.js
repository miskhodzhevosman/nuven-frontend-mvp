import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'

const user = ref(null)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))
let refreshTimeout = null

export function useAuth() {
  const router = useRouter()

  // Функция для установки таймера обновления токена
  function scheduleTokenRefresh(expiresIn) {
    // Очищаем старый таймер
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }

    // Обновляем за 5 минут до истечения
    const refreshTime = Math.max(expiresIn - 300, 60) // минимум 1 минута
    console.log(`🔄 Токен обновится через ${Math.round(refreshTime / 60)} минут`)

    refreshTimeout = setTimeout(async () => {
      console.log('🔄 Обновление токена...')
      try {
        await refreshToken()
      } catch (error) {
        console.error('❌ Не удалось обновить токен:', error)
        // Если не удалось обновить - выходим
        logout()
      }
    }, refreshTime * 1000)
  }

  // Функция обновления токена
  async function refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('Нет refresh токена')
      }

      const response = await authApi.refreshToken({ refresh: refreshToken })
      
      // Сохраняем новый access_token
      localStorage.setItem('access_token', response.data.access)
      
      // Если пришел новый refresh_token - сохраняем
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }

      isAuthenticated.value = true
      
      // Планируем следующее обновление
      // Если сервер возвращает время жизни, используем его
      // Иначе ставим 15 минут (стандарт для DRF JWT)
      const expiresIn = response.data.expires_in || 15 * 60 // 15 минут
      scheduleTokenRefresh(expiresIn)
      
      console.log('✅ Токен успешно обновлен')
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error)
      throw error
    }
  }

  // Функция входа
  async function login(username, password) {
    try {
      const response = await authApi.login({ 
        username: username, 
        password: password 
      })
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      isAuthenticated.value = true
      user.value = response.data.user || { username }
      
      // Планируем автоматическое обновление
      // JWT токены обычно живут 5 минут (в DRF по умолчанию)
      // Ставим обновление за 1 минуту до истечения
      const expiresIn = 4 * 60 // 4 минуты (стандарт в DRF JWT - 5 минут)
      scheduleTokenRefresh(expiresIn)
      
      router.push('/main')
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Функция выхода
  function logout() {
    // Очищаем таймер
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    isAuthenticated.value = false
    user.value = null
    router.push('/login')
  }

  // Проверка токена при загрузке
  async function checkAuth() {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        // Проверяем валидность токена через запрос к /me
        // или просто пытаемся обновить
        await refreshToken()
        return true
      } catch (error) {
        // Если токен невалидный - выходим
        console.warn('Токен невалидный, выход...')
        logout()
        return false
      }
    }
    return false
  }

  return {
    user,
    isAuthenticated: computed(() => isAuthenticated.value),
    login,
    logout,
    refreshToken,
    checkAuth
  }
}