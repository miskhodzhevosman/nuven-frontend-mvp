// src/services/transactions.service.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/'
})

export const transactionsService = {
  async getTransactions() {
    const { data } = await api.get('/finance/transactions/')
    return data
  },

  async createTransaction(payload) {
    const { data } = await api.post('/finance/transactions/', payload)
    return data
  },

  async updateTransaction(id, payload) {
    const { data } = await api.patch(`/finance/transactions/${id}/`, payload)
    return data
  },

  async deleteTransaction(id) {
    await api.delete(`/finance/transactions/${id}/`)
  },
  async getTransactions() {
    const { data } = await api.get('/finance/transactions/')
    return data
  },

  async createTransaction(payload) {
    const { data } = await api.post('/finance/transactions/', payload)
    return data
  },

  async updateTransaction(id, payload) {
    const { data } = await api.patch(`/finance/transactions/${id}/`, payload)
    return data
  },

  async deleteTransaction(id) {
    await api.delete(`/finance/transactions/${id}/`)
  },

  async getTransactionTypes() {
    const { data } = await api.get('/finance/transaction-types/')
    return data
  }
  
}