// composables/useApi.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json'
  }
})

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

// Interceptor для обработки 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (originalRequest.url?.includes('/token/refresh/') || originalRequest._retry) {
      return Promise.reject(error)
    }
    
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }
    
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
      
      const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
        refresh: refreshToken
      })
      
      const newAccessToken = response.data.access
      localStorage.setItem('access_token', newAccessToken)
      
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh)
      }
      
      processQueue(null, newAccessToken)
      
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
      
    } catch (refreshError) {
      processQueue(refreshError, null)
      
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      window.dispatchEvent(new CustomEvent('auth:logout'))
      
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api