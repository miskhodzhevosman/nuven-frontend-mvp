// src/services/projects.service.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
})

export const projectsService = {
  // =========================
  // Проекты
  // =========================
  async getProjects() {
    // Предполагаемый endpoint списка проектов
    const { data } = await api.get('/crm/projects/')
    return data
  },

  async getProjectById(id) {
    const { data } = await api.get(`/crm/projects/${id}/`)
    return data
  },

  async createProject(payload) {
    const { data } = await api.post('/crm/projects/', payload)
    return data
  },

  // =========================
  // Финансы проекта
  // =========================
  async getProjectFinance(projectId) {
    const { data } = await api.get(`/finance/projects/${projectId}/report/`)
    return data
  },

  async getProjectExpenseTransactions(projectId) {
    const { data } = await api.get(`/finance/projects/${projectId}/expense-transactions/`)
    return data
  },

  // =========================
  // Позиции проекта
  // =========================
  async getProjectItems(projectId) {
    const { data } = await api.get(`/crm/projects/${projectId}/items/`)
    return data
  },

  // =========================
  // Клиенты
  // =========================
  async getClients() {
    const { data } = await api.get('/crm/counterparties/by_type/', {
      params: { type: 'CLIENT' }
    })
    return data
  },

  async createClient(payload) {
    const { data } = await api.post('/crm/counterparties/', payload)
    return data
  },

  // =========================
  // Тех. менеджеры
  // =========================
  async getTechnicalManagers() {
    const { data } = await api.get('/crm/technical-managers/')
    return data
  },

  async createTechnicalManager(payload) {
    const { data } = await api.post('/crm/technical-managers/', payload)
    return data
  },

  // =========================
  // Товары (для позиций проекта)
  // =========================
  async getNomenclatures() {
    const { data } = await api.get('/supplies/nomenclatures/')
    return data
  },

  // =========================
  // Статусы проекта
  // =========================
  // ВАЖНО:
  // Если у вас нет отдельного endpoint статусов, замените это на свой источник.
  async getProjectStatuses() {
    // Предполагаемый endpoint
    const { data } = await api.get('/crm/project-statuses/')
    return data
  }
}