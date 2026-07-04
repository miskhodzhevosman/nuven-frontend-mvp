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

  async updateProject(id, payload) {
    const { data } = await api.patch(`/crm/projects/${id}/`, payload)
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
    const { data } = await api.get(`/finance/projects/${projectId}/report/`)
    return data
  },

  // =========================
  // Позиции проекта
  // =========================
  async getProjectItems(projectId) {
    const { data } = await api.get(`/crm/projects/${projectId}/items/`)
    return data
  },

  async createProjectItem(payload) {
    const { data } = await api.post('/crm/project-items/', payload)
    return data
  },

  async updateProjectItem(id, payload) {
    const { data } = await api.patch(`/crm/project-items/${id}/`, payload)
    return data
  },

  async deleteProjectItem(id) {
    await api.delete(`/crm/project-items/${id}/`)
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
  // Номенклатура
  // =========================
  async getNomenclatures() {
    const { data } = await api.get('/supplies/nomenclatures/')
    return data
  },

  // =========================
  // Статусы проекта
  // =========================
  async getProjectStatuses() {
    const { data } = await api.get('/crm/project-statuses/')
    return data
  }
}