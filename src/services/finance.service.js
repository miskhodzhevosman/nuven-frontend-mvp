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
 * TRANSACTIONS (General)
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

/**
 * =========================
 * PROJECT EXPENSES
 * =========================
 */

export async function getProjectExpenses(projectId) {
  const response = await httpGet(`/api/finance/projects/${projectId}/expenses/`)
  return handleResponse(response)
}

export async function createProjectExpense(projectId, payload) {
  // payload должен содержать: amount, date, finance_operation_type
  return await httpPost(`/api/finance/projects/${projectId}/expenses/`, payload)
}

export async function deleteProjectExpense(projectId, expenseId) {
  return await httpDelete(`/api/finance/projects/${projectId}/expenses/${expenseId}/`)
}

/**
 * =========================
 * CLIENT PAYMENTS
 * =========================
 */

export async function getClientPayments(projectId) {
  const response = await httpGet(`/api/finance/projects/${projectId}/client-payments/`)
  return handleResponse(response)
}

export async function createClientPayment(projectId, payload) {
  // payload должен содержать: amount, date
  return await httpPost(`/api/finance/projects/${projectId}/client-payments/`, payload)
}

export async function deleteClientPayment(projectId, paymentId) {
  return await httpDelete(`/api/finance/projects/${projectId}/client-payments/${paymentId}/`)
}

/**
 * =========================
 * FACTORY PAYMENTS
 * =========================
 */

export async function getFactoryPayments(projectId) {
  const response = await httpGet(`/api/finance/projects/${projectId}/factory-payments/`)
  return handleResponse(response)
}

export async function createFactoryPayment(projectId, payload) {
  // payload должен содержать: counterparty, amount, date
  return await httpPost(`/api/finance/projects/${projectId}/factory-payments/`, payload)
}

export async function deleteFactoryPayment(projectId, paymentId) {
  return await httpDelete(`/api/finance/projects/${projectId}/factory-payments/${paymentId}/`)
}