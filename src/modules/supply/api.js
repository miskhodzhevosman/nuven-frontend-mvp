import api from '@/composables/useApi'

export const supplyApi = {
  // Фабрики
  factories: {
    list: (params) => api.get('/supplies/factories/', { params }),
    create: (data) => api.post('/supplies/factories/', data),
    update: (id, data) => api.put(`/supplies/factories/${id}/`, data),
    delete: (id) => api.delete(`/supplies/factories/${id}/`)
  },
  
  // Номенклатура
  nomenclatures: {
    list: (params) => api.get('/supplies/nomenclatures/', { params }),
    create: (data) => api.post('/supplies/nomenclatures/', data),
    update: (id, data) => api.put(`/supplies/nomenclatures/${id}/`, data),
    delete: (id) => api.delete(`/supplies/nomenclatures/${id}/`)
  },

  // Локации
  locations: {
    list: (params) => api.get('/supplies/locations/', { params }),
    tree: () => api.get('/supplies/locations/tree/'),
    create: (data) => api.post('/supplies/locations/', data),
    update: (id, data) => api.put(`/supplies/locations/${id}/`, data),
    delete: (id) => api.delete(`/supplies/locations/${id}/`)
  }
}