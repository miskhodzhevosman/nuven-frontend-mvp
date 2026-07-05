const BASE_URL = 'http://127.0.0.1:8000/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json()
      message = data?.detail || JSON.stringify(data)
    } catch (e) {
      // ignore
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

/**
 * =========================
 * REPORTS (твои методы)
 * =========================
 */

export async function getFinanceReport() {
  const res = await fetch(`${BASE_URL}/finance/report/`)

  if (!res.ok) {
    throw new Error('Failed to load finance report')
  }

  return await res.json()
}

export async function getProjectFinanceReport(projectId) {
  const res = await fetch(`${BASE_URL}/finance/projects/${projectId}/report/`)

  if (!res.ok) {
    throw new Error(`Failed to load finance report for project ${projectId}`)
  }

  return await res.json()
}

/**
 * =========================
 * OPERATION TYPES
 * =========================
 */

export function getOperationTypes() {
  return request('/finance/operation-types/')
}

export function createOperationType(payload) {
  return request('/finance/operation-types/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * =========================
 * TRANSACTIONS
 * =========================
 */

export function getTransactions() {
  return request('/finance/transactions/')
}

export function getTransaction(id) {
  return request(`/finance/transactions/${id}/`)
}

export function createTransaction(payload) {
  return request('/finance/transactions/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateTransaction(id, payload) {
  return request(`/finance/transactions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export function deleteTransaction(id) {
  return request(`/finance/transactions/${id}/`, {
    method: 'DELETE'
  })
}