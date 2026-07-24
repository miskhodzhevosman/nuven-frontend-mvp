// composables/useApi.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://147.45.230.130:8000/api/',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Переменная для предотвращения множественных запросов на обновление
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    // Пропускаем запросы на обновление токена
    if (config.url?.includes('/token/refresh/')) {
      return config
    }
    
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor для обработки 401 и refresh токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Если это запрос на обновление токена или уже был повтор - не обрабатываем
    if (originalRequest.url?.includes('/token/refresh/') || originalRequest._retry) {
      return Promise.reject(error)
    }
    
    // Только 401 ошибки
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }
    
    // Если уже идет обновление, добавляем запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch(err => Promise.reject(err))
    }
    
    originalRequest._retry = true
    isRefreshing = true
    
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      
      // Используем axios напрямую, чтобы избежать цикла
      const response = await axios.post('http://147.45.230.130:8000/api/token/refresh/', {
        refresh: refreshToken
      })
      
      const newAccessToken = response.data.access
      localStorage.setItem('access_token', newAccessToken)
      
      // Если пришел новый refresh_token (при rotate), сохраняем
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }
      
      // Обрабатываем очередь запросов
      processQueue(null, newAccessToken)
      
      // Повторяем исходный запрос
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
      
    } catch (refreshError) {
      // Очищаем очередь с ошибкой
      processQueue(refreshError, null)
      
      // Если не удалось обновить - выходим
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      // Триггерим событие для logout
      window.dispatchEvent(new Event('auth:logout'))
      
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api