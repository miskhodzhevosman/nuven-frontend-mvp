import api from '@/composables/useApi'

const API_URL = '/users'

export const userApi = {
  // Получить список пользователей
  getUsers(params = {}) {
    return api.get(API_URL, { params })
  },

  // Получить пользователя по ID
  getUser(id) {
    return api.get(`${API_URL}/${id}/`)
  },

  // Создать пользователя
  createUser(data) {
    return api.post(API_URL, data)
  },

  // Обновить пользователя
  updateUser(id, data) {
    return api.patch(`${API_URL}/${id}/`, data)
  },

  // Полное обновление пользователя
  replaceUser(id, data) {
    return api.put(`${API_URL}/${id}/`, data)
  },

  // Удалить пользователя
  deleteUser(id) {
    return api.delete(`${API_URL}/${id}/`)
  },

  // Получить текущего пользователя
  getCurrentUser() {
    return api.get(`${API_URL}/me/`)
  },

  // Обновить текущего пользователя
  updateCurrentUser(data) {
    return api.patch(`${API_URL}/me/`, data)
  },

  // Сменить пароль
  changePassword(data) {
    return api.post(`${API_URL}/change-password/`, data)
  },

  // Активировать/деактивировать пользователя
  setUserActive(id, isActive) {
    return api.post(`${API_URL}/${id}/set-active/`, { is_active: isActive })
  }
}