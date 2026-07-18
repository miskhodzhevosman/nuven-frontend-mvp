import api from '@/composables/useApi'

export const authApi = {
  login: (credentials) => api.post('token/', credentials),
  refresh: (refreshToken) => api.post('token/refresh/', { refresh: refreshToken })
}