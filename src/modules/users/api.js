import api from '@/composables/useApi'

const API_URL = '/users'

export const userApi = {
  // Получить список пользователей
  getUsers(params = {}) {
    // params может содержать: page, page_size, search, group, is_active, etc.
    return api.get(API_URL, { params })
  },

  // Получить пользователя по ID
  getUser(id) {
    return api.get(`${API_URL}/${id}/`)
  },

  // Создать пользователя - ИСПРАВЛЕНО!
  createUser(data) {
    return api.post(`${API_URL}/`, data)  // ← добавили слеш
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
  },
   getUserGroups(userId) {
    return api.get(`${API_URL}/${userId}/groups/`)
  },

  // Добавить пользователя в группу
  addUserToGroup(userId, groupId) {
    return api.post(`/users/${userId}/groups/`, { group_id: groupId })
  },

  // Удалить пользователя из группы
  removeUserFromGroup(userId, groupId) {
    return api.delete(`/users/${userId}/groups/?group_id=${groupId}`)
  },
    getUserGroups(userId) {
    return api.get(`/users/${userId}/groups/`)
  },

  // Обновить группы пользователя (заменить все)
 setUserGroups(userId, groupIds) {
    return api.put(`/users/${userId}/groups/`, { 
      group_ids: groupIds 
    })
  },

  // Получить все доступные группы
  getAllGroups() {
    return api.get('/users/groups/')
  },

  // Создать группу
  createGroup(data) {
    return api.post('/users/groups/', data)
  },

  // Обновить группу
  updateGroup(id, data) {
    return api.patch(`/users/groups/${id}/`, data)
  },

  // Удалить группу
  deleteGroup(id) {
    return api.delete(`/users/groups/${id}/`)
  }
}
