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

  // ---- История изменений проектов ----
async getProjectHistory(projectId, params = {}) {
  const res = await api.get(`${CRM}/projects/${projectId}/history/`, { params })
  return res.data
},

// ---- История изменений статусов ----
async getStatusHistory(statusId, params = {}) {
  const res = await api.get(`${CRM}/project-statuses/${statusId}/history/`, { params })
  return res.data
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

  // ---- Counterparties ----
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

  // ---- Supplies: factories ----
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

  // ---- Supplies: locations ----
  async getLocations(params = {}) {
    const res = await api.get(`${SUPPLIES}/locations/`, { params })
    return res.data
  },
  async getLocationsTree() {
    const res = await api.get(`${SUPPLIES}/locations/tree/`)
    return unwrap(res)
  },

  // ---- Finance: типы операций ----
  async getFinanceOperationTypes(params = {}) {
    const res = await api.get(`/finance/operation-types/`, { params })
    return res.data
  },
  // ---- Автокомплит для клиентов ----
  async autocompleteClients(query = '') {
    const res = await api.get(`${CRM}/counterparties/autocomplete-clients/`, { 
      params: { q: query } 
    })
    return res.data
  },

  // ---- Автокомплит для менеджеров (если есть отдельный эндпоинт) ----
  // Если отдельного эндпоинта нет, можно использовать фильтрацию существующих
  async autocompleteManagers(query = '') {
    // Если есть отдельный эндпоинт, используйте его
    const res = await api.get(`${CRM}/technical-managers/autocomplete/`, { params: { q: query } })
    return res.data
    
    // // Или используйте существующий эндпоинт с фильтрацией
    // const res = await api.get(`${CRM}/technical-managers/`, { 
    //   params: { search: query } 
    // })
    // return res.data.results || []
  },


  // ПОТОМ ПЕРЕЕХАТЬ В SYPPLY
  // ---- Supplies: locations ----
async getLocations(params = {}) {
  const res = await api.get(`${SUPPLIES}/locations/`, { params })
  return res.data
},
async getLocationsTree() {
  const res = await api.get(`${SUPPLIES}/locations/tree/`)
  return unwrap(res)
},
// Добавьте метод для автокомплита локаций
async autocompleteLocations(query = '') {
  const res = await api.get(`${SUPPLIES}/locations/autocomplete/`, { 
    params: { q: query } 
  })
  return res.data
},

  // ---- Finance: платежи и расходы по проекту ----
  getClientPayments: (params) => financeApi.getClientPayments(params),
  createClientPayment: (payload) => financeApi.createClientPayment(payload),
  getFactoryPayments: (params) => financeApi.getFactoryPayments(params),
  createFactoryPayment: (payload) => financeApi.createFactoryPayment(payload),
  getProjectExpenses: (params) => financeApi.getProjectExpenses(params),
  createProjectExpense: (payload) => financeApi.createProjectExpense(payload),
}