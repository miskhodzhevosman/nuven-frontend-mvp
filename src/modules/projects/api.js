import api from '../../composables/useApi'
import { financeApi } from '@/modules/finance/api'

const CRM = '/crm'
const SUPPLIES = '/supplies'

function unwrap(res) {
  return res.data?.results ?? res.data ?? []
}

export const projectsApi = {
  // ---- Projects ----
  async getProjects(params = {}) {
    const res = await api.get(`${CRM}/projects/`, { params })
    return res.data
  },
  async getProject(id) {
    const res = await api.get(`${CRM}/projects/${id}/`)
    return res.data
  },
  async createProject(payload) {
    const res = await api.post(`${CRM}/projects/`, payload)
    return res.data
  },
  async updateProject(id, payload) {
    const res = await api.patch(`${CRM}/projects/${id}/`, payload)
    return res.data
  },
  async deleteProject(id) {
    await api.delete(`${CRM}/projects/${id}/`)
  },

  // ---- Project items ----
  async getProjectItems(projectId, params = {}) {
    const res = await api.get(`${CRM}/projects/${projectId}/items/`, { params })
    return res.data
  },
  
  async createProjectItem(payload) {
    const res = await api.post(`${CRM}/project-items/`, payload)
    return res.data
  },
  async updateProjectItem(id, payload) {
    const res = await api.patch(`${CRM}/project-items/${id}/`, payload)
    return res.data
  },
  async deleteProjectItem(id) {
    await api.delete(`${CRM}/project-items/${id}/`)
  },

  // ---- Project statuses (справочник) ----
  async getProjectStatuses() {
    const res = await api.get(`${CRM}/project-statuses/`)
    return unwrap(res)
  },
  async createProjectStatus(payload) {
    const res = await api.post(`${CRM}/project-statuses/`, payload)
    return res.data
  },
  async updateProjectStatus(id, payload) {
    const res = await api.patch(`${CRM}/project-statuses/${id}/`, payload)
    return res.data
  },
  async deleteProjectStatus(id) {
    await api.delete(`${CRM}/project-statuses/${id}/`)
  },

  // ---- Technical managers (справочник) ----
  async getTechnicalManagers() {
    const res = await api.get(`${CRM}/technical-managers/`)
    return unwrap(res)
  },
  async createTechnicalManager(payload) {
    const res = await api.post(`${CRM}/technical-managers/`, payload)
    return res.data
  },
  async updateTechnicalManager(id, payload) {
    const res = await api.patch(`${CRM}/technical-managers/${id}/`, payload)
    return res.data
  },
  async deleteTechnicalManager(id) {
    await api.delete(`${CRM}/technical-managers/${id}/`)
  },

  // ---- Counterparties (клиенты для select в проекте) ----
  async getCounterparties(params = {}) {
    const res = await api.get(`${CRM}/counterparties/`, { params })
    return res.data
  },
  async getCounterpartiesByType(type) {
    const res = await api.get(`${CRM}/counterparties/by_type/`, { params: { type } })
    return unwrap(res)
  },
  async createCounterparty(payload) {
    const res = await api.post(`${CRM}/counterparties/`, payload)
    return res.data
  },
  async updateCounterparty(id, payload) {
    const res = await api.patch(`${CRM}/counterparties/${id}/`, payload)
    return res.data
  },
  async deleteCounterparty(id) {
    await api.delete(`${CRM}/counterparties/${id}/`)
  },

  // ---- Supplies: nomenclatures ----
  async getNomenclatures(params = {}) {
    const res = await api.get(`${SUPPLIES}/nomenclatures/`, { params })
    return res.data
  },
  async createNomenclature(payload) {
    const res = await api.post(`${SUPPLIES}/nomenclatures/`, payload)
    return res.data
  },
  async updateNomenclature(id, payload) {
    const res = await api.patch(`${SUPPLIES}/nomenclatures/${id}/`, payload)
    return res.data
  },
  async deleteNomenclature(id) {
    await api.delete(`${SUPPLIES}/nomenclatures/${id}/`)
  },

  // ---- Supplies: factories (контрагенты типа FACTORY) ----
  async getFactories(params = {}) {
    const res = await api.get(`${SUPPLIES}/factories/`, { params })
    return res.data
  },
  async createFactory(payload) {
    const res = await api.post(`${SUPPLIES}/factories/`, payload)
    return res.data
  },
  async updateFactory(id, payload) {
    const res = await api.patch(`${SUPPLIES}/factories/${id}/`, payload)
    return res.data
  },
  async deleteFactory(id) {
    await api.delete(`${SUPPLIES}/factories/${id}/`)
  },

  // ---- Supplies: locations (для select локации проекта) ----
  async getLocations(params = {}) {
    const res = await api.get(`${SUPPLIES}/locations/`, { params })
    return res.data
  },
  async getLocationsTree() {
    const res = await api.get(`${SUPPLIES}/locations/tree/`)
    return unwrap(res)
  },

  // ---- Finance: типы операций (исправленный URL) ----
  async getFinanceOperationTypes(params = {}) {
    const res = await api.get(`/finance/operation-types/`, { params })
    return res.data
  },

  // ---- Finance: платежи и расходы по проекту (делегируем в financeApi) ----
  getClientPayments: (params) => financeApi.getClientPayments(params),
  createClientPayment: (payload) => financeApi.createClientPayment(payload),
  getFactoryPayments: (params) => financeApi.getFactoryPayments(params),
  createFactoryPayment: (payload) => financeApi.createFactoryPayment(payload),
  getProjectExpenses: (params) => financeApi.getProjectExpenses(params),
  createProjectExpense: (payload) => financeApi.createProjectExpense(payload),
}