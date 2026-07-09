// src/services/finance.service.js
import {
  httpGet,
  httpPost,
  httpPatch,
  httpDelete,
  handleResponse,
} from '@/api/http'

/**
 * =========================
 * REPORTS
 * =========================
 */

export async function getFinanceReport() {
  const response = await httpGet('/api/finance/report/')
  return handleResponse(response)
}

export async function getProjectFinanceReport(projectId) {
  const response = await httpGet(`/api/finance/projects/${projectId}/report/`)
  return handleResponse(response)
}

/**
 * =========================
 * OPERATION TYPES
 * =========================
 */

export async function getOperationTypes() {
  const response = await httpGet('/api/finance/operation-types/')
  return handleResponse(response)
}

export async function createOperationType(payload) {
  return await httpPost('/api/finance/operation-types/', payload)
}

/**
 * =========================
 * TRANSACTIONS
 * =========================
 */

export async function getTransactions() {
  const response = await httpGet('/api/finance/transactions/')
  return handleResponse(response)
}

export async function getTransaction(id) {
  const response = await httpGet(`/api/finance/transactions/${id}/`)
  return handleResponse(response)
}

export async function createTransaction(payload) {
  return await httpPost('/api/finance/transactions/', payload)
}

export async function updateTransaction(id, payload) {
  return await httpPatch(`/api/finance/transactions/${id}/`, payload)
}

export async function deleteTransaction(id) {
  return await httpDelete(`/api/finance/transactions/${id}/`)
}