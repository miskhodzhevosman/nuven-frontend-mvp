// api/auth.js
import api from '@/composables/useApi'

export const authApi = {
  login: (credentials) => api.post('token/', credentials),
  refreshToken: (data) => api.post('token/refresh/', data),
  logout: () => api.post('logout/'), // исправлен путь
  me: () => api.get('me/'), // исправлен путь
}