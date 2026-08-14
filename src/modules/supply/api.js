import api from '@/composables/useApi'

export const supplyApi = {
  // Фабрики
  factories: {
    list: (params) => api.get('/supplies/factories/', { params }),
    create: (data) => api.post('/supplies/factories/', data),
    update: (id, data) => api.put(`/supplies/factories/${id}/`, data),
    delete: (id) => api.delete(`/supplies/factories/${id}/`),
    get: (id) => api.get(`/supplies/factories/${id}/`) // Добавляем get метод
  },
  
  // Файлы фабрик
  factoryFiles: {
    list: (params) => api.get('/supplies/factory-files/', { params }),
    create: (data) => {
      return api.post('/supplies/factory-files/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    delete: (id) => api.delete(`/supplies/factory-files/${id}/`),
    update: (id, data) => api.patch(`/supplies/factory-files/${id}/`, data)
  },
  
  // Номенклатура
  nomenclatures: {
    list: (params) => api.get('/supplies/nomenclatures/', { params }),
    search: (query) => api.get('/supplies/nomenclatures/search/', { params: { q: query } }),
    create: (data) => api.post('/supplies/nomenclatures/', data),
    update: (id, data) => api.put(`/supplies/nomenclatures/${id}/`, data),
    delete: (id) => api.delete(`/supplies/nomenclatures/${id}/`),
    get: (id) => api.get(`/supplies/nomenclatures/${id}/`)
  },

  // Локации
  locations: {
    list: (params) => api.get('/supplies/locations/', { params }),
    tree: () => api.get('/supplies/locations/tree/'),
    create: (data) => api.post('/supplies/locations/', data),
    update: (id, data) => api.put(`/supplies/locations/${id}/`, data),
    delete: (id) => api.delete(`/supplies/locations/${id}/`)
  },

  // Изображения
  images: {
    list: (params) => api.get('/supplies/images/', { params }),
    create: (data) => {
      return api.post('/supplies/images/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    update: (id, data) => api.patch(`/supplies/images/${id}/`, data),
    delete: (id) => api.delete(`/supplies/images/${id}/`),
    setMain: (id) => api.post(`/supplies/images/${id}/set_main/`)
  },

  // Файлы номенклатуры
  files: {
    list: (params) => api.get('/supplies/files/', { params }),
    create: (data) => {
      return api.post('/supplies/files/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    update: (id, data) => api.patch(`/supplies/files/${id}/`, data),
    delete: (id) => api.delete(`/supplies/files/${id}/`)
  }
}