import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'

const user = ref(null)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))

export function useAuth() {
  const router = useRouter()

  // Теперь принимаем username
  async function login(username, password) {
    try {
      // Отправляем объект с полем username
      const response = await authApi.login({ 
        username: username, 
        password: password 
      })
      
      // Сохраняем токены
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      isAuthenticated.value = true
      user.value = response.data.user || { username }
      
      router.push('/supply')
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    isAuthenticated.value = false
    user.value = null
    router.push('/login')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
}