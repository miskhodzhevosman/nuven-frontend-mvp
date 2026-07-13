// src/services/projects.service.js
import {
  httpGet,
  httpPost,
  httpPatch,
  httpDelete,
  handleResponse,
} from '@/api/http'

/**
 * Извлекает массив из пагинированного или обычного ответа
 */
function extractArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  
  console.warn('⚠️ Unexpected API response format:', data)
  return []
}

export const projectsService = {
  // =========================
  // Проекты
  // =========================
  async getProjects() {
    const response = await httpGet('/api/crm/projects/')
    const data = await handleResponse(response)
    return extractArray(data)
  },

  async getProjectById(id) {
    const response = await httpGet(`/api/crm/projects/${id}/`)
    return handleResponse(response)
  },

  async createProject(payload) {
    return await httpPost('/api/crm/projects/', payload)
  },

  async updateProject(id, payload) {
    return await httpPatch(`/api/crm/projects/${id}/`, payload)
  },

  // =========================
  // Финансы проекта
  // =========================
  async getProjectFinance(projectId) {
    const response = await httpGet(`/api/finance/projects/${projectId}/report/`)
    return handleResponse(response)
  },

  async getProjectExpenseTransactions(projectId) {
    const response = await httpGet(`/api/finance/projects/${projectId}/report/`)
    return handleResponse(response)
  },

  // =========================
  // Позиции проекта
  // =========================
  async getProjectItems(projectId) {
    const response = await httpGet(`/api/crm/projects/${projectId}/items/`)
    const data = await handleResponse(response)
    return extractArray(data)
  },

  async createProjectItem(payload) {
    return await httpPost('/api/crm/project-items/', payload)
  },

  async updateProjectItem(id, payload) {
    return await httpPatch(`/api/crm/project-items/${id}/`, payload)
  },

  async deleteProjectItem(id) {
    return await httpDelete(`/api/crm/project-items/${id}/`)
  },

  // =========================
  // Клиенты
  // =========================
  async getClients() {
    const response = await httpGet('/api/crm/counterparties/by_type/?type=CLIENT')
    const data = await handleResponse(response)
    return extractArray(data)
  },

  async createClient(payload) {
    return await httpPost('/api/crm/counterparties/', payload)
  },

  // =========================
  // Тех. менеджеры
  // =========================
  async getTechnicalManagers() {
    const response = await httpGet('/api/crm/technical-managers/')
    const data = await handleResponse(response)
    return extractArray(data)
  },

  async createTechnicalManager(payload) {
    return await httpPost('/api/crm/technical-managers/', payload)
  },

  // =========================
  // Номенклатура
  // =========================
  async getNomenclatures() {
    const response = await httpGet('/api/supplies/nomenclatures/')
    const data = await handleResponse(response)
    return extractArray(data)
  },

  // =========================
  // Статусы проекта
  // =========================
  async getProjectStatuses() {
    const response = await httpGet('/api/crm/project-statuses/')
    const data = await handleResponse(response)
    return extractArray(data)
  },
  async createNomenclature(payload) {
  return await httpPost('/api/supplies/nomenclatures/', payload)
}
}