import api from '../../composables/useApi'

const BASE = '/finance'

function unwrap(res) {
  return res.data?.results ?? res.data ?? []
}

export const financeApi = {
  // ---- Operation types (справочник) ----
  async getOperationTypes() {
    const res = await api.get(`${BASE}/operation-types/`)
    return unwrap(res)
  },
  async createOperationType(payload) {
    const res = await api.post(`${BASE}/operation-types/`, payload)
    return res.data
  },
  async updateOperationType(id, payload) {
    const res = await api.patch(`${BASE}/operation-types/${id}/`, payload)
    return res.data
  },
  async deleteOperationType(id) {
    await api.delete(`${BASE}/operation-types/${id}/`)
  },

  // ---- Transactions (универсальная операция) ----
  async getTransactions(params = {}) {
    const res = await api.get(`${BASE}/transactions/`, { params })
    return res.data
  },
  async getTransaction(id) {
    const res = await api.get(`${BASE}/transactions/${id}/`)
    return res.data
  },
  async createTransaction(payload) {
    const res = await api.post(`${BASE}/transactions/`, payload)
    return res.data
  },
  async updateTransaction(id, payload) {
    const res = await api.put(`${BASE}/transactions/${id}/`, payload)
    return res.data
  },
  async patchTransaction(id, payload) {
    const res = await api.patch(`${BASE}/transactions/${id}/`, payload)
    return res.data
  },
  async deleteTransaction(id) {
    await api.delete(`${BASE}/transactions/${id}/`)
  },

  // ---- Специализированные операции ----
  
  // Client payments (project_id обязателен)
  async getClientPayments(params = {}) {
    const res = await api.get(`${BASE}/client-payments/`, { params })
    return res.data
  },
  async createClientPayment(payload) {
    const res = await api.post(`${BASE}/client-payments/`, payload)
    return res.data
  },
  async updateClientPayment(id, payload) {
    const res = await api.patch(`${BASE}/client-payments/${id}/`, payload)
    return res.data
  },
  async deleteClientPayment(id) {
    await api.delete(`${BASE}/client-payments/${id}/`)
  },

  // Factory payments (project_id обязателен)
  async getFactoryPayments(params = {}) {
    const res = await api.get(`${BASE}/factory-payments/`, { params })
    return res.data
  },
  async createFactoryPayment(payload) {
    const res = await api.post(`${BASE}/factory-payments/`, payload)
    return res.data
  },
  async updateFactoryPayment(id, payload) {
    const res = await api.patch(`${BASE}/factory-payments/${id}/`, payload)
    return res.data
  },
  async deleteFactoryPayment(id) {
    await api.delete(`${BASE}/factory-payments/${id}/`)
  },

  // ---- Project expenses (project_id обязателен) ----
  async getProjectExpenses(params = {}) {
    const res = await api.get(`${BASE}/project-expenses/`, { params })
    return res.data
  },
  async getProjectExpense(id) {
    const res = await api.get(`${BASE}/project-expenses/${id}/`)
    return res.data
  },
  async createProjectExpense(payload) {
    const res = await api.post(`${BASE}/project-expenses/`, payload)
    return res.data
  },
  async updateProjectExpense(id, payload) {
    const res = await api.patch(`${BASE}/project-expenses/${id}/`, payload)
    return res.data
  },
  async deleteProjectExpense(id) {
    await api.delete(`${BASE}/project-expenses/${id}/`)
  },

  // ---- Operation expenses (project_id НЕ используется) ----
  async getOperationExpenses(params = {}) {
    const res = await api.get(`${BASE}/operation-expenses/`, { params })
    return res.data
  },
  async getOperationExpense(id) {
    const res = await api.get(`${BASE}/operation-expenses/${id}/`)
    return res.data
  },
  async createOperationExpense(payload) {
    const res = await api.post(`${BASE}/operation-expenses/`, payload)
    return res.data
  },
  async updateOperationExpense(id, payload) {
    const res = await api.patch(`${BASE}/operation-expenses/${id}/`, payload)
    return res.data
  },
  async deleteOperationExpense(id) {
    await api.delete(`${BASE}/operation-expenses/${id}/`)
  },

  // ---- Отчёты ----
  async getGlobalReport() {
    const res = await api.get(`${BASE}/reports/global/`)
    return res.data
  },
  async getProjectReport(projectId) {
    const res = await api.get(`${BASE}/reports/projects/${projectId}/`)
    return res.data
  },
}