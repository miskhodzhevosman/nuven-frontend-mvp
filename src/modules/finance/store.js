import { defineStore } from 'pinia'
import { financeApi } from './api'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [],
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
  },

  actions: {
    setError(e) {
      this.error = e?.response?.data ?? e?.message ?? String(e)
    },

    async fetchOperationTypes() {
      try {
        this.operationTypes = await financeApi.getOperationTypes()
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

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
        const updated = await financeApi.updateTransaction(id, payload)
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
  },
})
