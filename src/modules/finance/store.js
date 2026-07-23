import { defineStore } from 'pinia'
import { financeApi } from './api'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [],
    projectExpenses: [],
    operationExpenses: [],
    clientPayments: [],
    factoryPayments: [],
    operationTypes: [],
    report: null,
    count: 0,
    next: null,
    previous: null,
    loading: false,
    error: null,
  }),

  getters: {
    operationTypeById: (state) => (id) =>
      state.operationTypes.find((t) => t.id === id) || null,
    operationTypeName: (state) => (id) => {
      const t = state.operationTypes.find((x) => x.id === id)
      return t ? t.name : `#${id}`
    },
    operationTypeCode: (state) => (id) => {
      const t = state.operationTypes.find((x) => x.id === id)
      return t ? t.code : ''
    },
    projectExpensesByProject: (state) => (projectId) => {
      return state.projectExpenses.filter(e => e.project === projectId || e.project?.id === projectId)
    },
    clientPaymentsByProject: (state) => (projectId) => {
      return state.clientPayments.filter(p => p.project === projectId || p.project?.id === projectId)
    },
    factoryPaymentsByProject: (state) => (projectId) => {
      return state.factoryPayments.filter(p => p.project === projectId || p.project?.id === projectId)
    },
  },

  actions: {
    setError(e) {
      this.error = e?.response?.data ?? e?.message ?? String(e)
    },

    // ---- Operation Types ----
    async fetchOperationTypes() {
      try {
        this.operationTypes = await financeApi.getOperationTypes()
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async createOperationType(payload) {
      try {
        const created = await financeApi.createOperationType(payload)
        this.operationTypes.push(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async updateOperationType(id, payload) {
      try {
        const updated = await financeApi.updateOperationType(id, payload)
        const idx = this.operationTypes.findIndex((t) => t.id === id)
        if (idx !== -1) this.operationTypes[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async deleteOperationType(id) {
      try {
        await financeApi.deleteOperationType(id)
        this.operationTypes = this.operationTypes.filter((t) => t.id !== id)
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Project Expenses ----
    async fetchProjectExpenses(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await financeApi.getProjectExpenses(params)
        this.projectExpenses = data.results ?? data ?? []
        this.count = data.count ?? this.projectExpenses.length
        this.next = data.next ?? null
        this.previous = data.previous ?? null
        return this.projectExpenses
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProjectExpense(id) {
      this.loading = true
      this.error = null
      try {
        const expense = await financeApi.getProjectExpense(id)
        const idx = this.projectExpenses.findIndex((e) => e.id === id)
        if (idx !== -1) this.projectExpenses[idx] = expense
        return expense
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createProjectExpense(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await financeApi.createProjectExpense(payload)
        this.projectExpenses.unshift(created)
        this.count += 1
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateProjectExpense(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await financeApi.updateProjectExpense(id, payload)
        const idx = this.projectExpenses.findIndex((e) => e.id === id)
        if (idx !== -1) this.projectExpenses[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteProjectExpense(id) {
      this.loading = true
      this.error = null
      try {
        await financeApi.deleteProjectExpense(id)
        this.projectExpenses = this.projectExpenses.filter((e) => e.id !== id)
        this.count = Math.max(0, this.count - 1)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Operation Expenses ----
    async fetchOperationExpenses(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await financeApi.getOperationExpenses(params)
        this.operationExpenses = data.results ?? data ?? []
        return this.operationExpenses
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createOperationExpense(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await financeApi.createOperationExpense(payload)
        this.operationExpenses.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateOperationExpense(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await financeApi.updateOperationExpense(id, payload)
        const idx = this.operationExpenses.findIndex((e) => e.id === id)
        if (idx !== -1) this.operationExpenses[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteOperationExpense(id) {
      this.loading = true
      this.error = null
      try {
        await financeApi.deleteOperationExpense(id)
        this.operationExpenses = this.operationExpenses.filter((e) => e.id !== id)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Client Payments (Полный CRUD) ----
    async fetchClientPayments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await financeApi.getClientPayments(params)
        this.clientPayments = data.results ?? data ?? []
        this.count = data.count ?? this.clientPayments.length
        this.next = data.next ?? null
        this.previous = data.previous ?? null
        return this.clientPayments
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchClientPayment(id) {
      this.loading = true
      this.error = null
      try {
        // Используем универсальный getTransaction или добавляем в api
        const payment = await financeApi.getTransaction(id)
        const idx = this.clientPayments.findIndex((p) => p.id === id)
        if (idx !== -1) this.clientPayments[idx] = payment
        return payment
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createClientPayment(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await financeApi.createClientPayment(payload)
        this.clientPayments.unshift(created)
        this.count += 1
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateClientPayment(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await financeApi.updateClientPayment(id, payload)
        const idx = this.clientPayments.findIndex((p) => p.id === id)
        if (idx !== -1) this.clientPayments[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteClientPayment(id) {
      this.loading = true
      this.error = null
      try {
        await financeApi.deleteClientPayment(id)
        this.clientPayments = this.clientPayments.filter((p) => p.id !== id)
        this.count = Math.max(0, this.count - 1)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Factory Payments ----
    async fetchFactoryPayments(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await financeApi.getFactoryPayments(params)
        this.factoryPayments = data.results ?? data ?? []
        this.count = data.count ?? this.factoryPayments.length
        this.next = data.next ?? null
        this.previous = data.previous ?? null
        return this.factoryPayments
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchFactoryPayment(id) {
      this.loading = true
      this.error = null
      try {
        const payment = await financeApi.getTransaction(id)
        const idx = this.factoryPayments.findIndex((p) => p.id === id)
        if (idx !== -1) this.factoryPayments[idx] = payment
        return payment
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createFactoryPayment(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await financeApi.createFactoryPayment(payload)
        this.factoryPayments.unshift(created)
        this.count += 1
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateFactoryPayment(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await financeApi.updateFactoryPayment(id, payload)
        const idx = this.factoryPayments.findIndex((p) => p.id === id)
        if (idx !== -1) this.factoryPayments[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteFactoryPayment(id) {
      this.loading = true
      this.error = null
      try {
        await financeApi.deleteFactoryPayment(id)
        this.factoryPayments = this.factoryPayments.filter((p) => p.id !== id)
        this.count = Math.max(0, this.count - 1)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Transactions (универсальные) ----
    async fetchTransactions(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await financeApi.getTransactions(params)
        this.transactions = data.results ?? []
        this.count = data.count ?? this.transactions.length
        this.next = data.next ?? null
        this.previous = data.previous ?? null
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchTransaction(id) {
      this.loading = true
      this.error = null
      try {
        const transaction = await financeApi.getTransaction(id)
        return transaction
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createTransaction(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await financeApi.createTransaction(payload)
        this.transactions.unshift(created)
        this.count += 1
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateTransaction(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await financeApi.patchTransaction(id, payload)
        const idx = this.transactions.findIndex((t) => t.id === id)
        if (idx !== -1) this.transactions[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteTransaction(id) {
      this.loading = true
      this.error = null
      try {
        await financeApi.deleteTransaction(id)
        this.transactions = this.transactions.filter((t) => t.id !== id)
        this.count = Math.max(0, this.count - 1)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Reports ----
    async fetchGlobalReport() {
      this.loading = true
      this.error = null
      try {
        this.report = await financeApi.getGlobalReport()
        return this.report
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProjectReport(projectId) {
      this.loading = true
      this.error = null
      try {
        this.report = await financeApi.getProjectReport(projectId)
        return this.report
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})