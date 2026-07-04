// src/services/products.service.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
})

export const productsService = {
  async getProducts() {
    const { data } = await api.get('/supplies/nomenclatures/')
    return data
  },

  async createProduct(payload) {
    const { data } = await api.post('/supplies/nomenclatures/', payload)
    return data
  },

  async updateProduct(id, payload) {
    const { data } = await api.patch(`/supplies/nomenclatures/${id}/`, payload)
    return data
  },

  async deleteProduct(id) {
    await api.delete(`/supplies/nomenclatures/${id}/`)
  },

  async getFactories() {
    const { data } = await api.get('/supplies/factories/')
    return data
  },

  async createFactory(payload) {
    const { data } = await api.post('/supplies/factories/', payload)
    return data
  }
}