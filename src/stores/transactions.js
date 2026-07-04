// src/stores/transactions.js
import { defineStore } from 'pinia'
import { transactionsService } from '@/services/transactions.service'
import { projectsService } from '@/services/projects.service'

const CLIENT_INCOME_CODE = 'client_pay'

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    transactionTypes: [],
    projects: [],
    clients: [],

    loading: false,
    saving: false,
    deletingId: null,
  }),

  getters: {
    projectsMap(state) {
      return state.projects.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    clientsMap(state) {
      return state.clients.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    transactionTypesMap(state) {
      return state.transactionTypes.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    /**
     * Только поступления от клиентов
     */
    clientIncomeTransactions(state) {
      return state.transactions
        .filter(item => {
          if (!item) return false

          // если transaction_type пришёл объектом
          if (typeof item.transaction_type === 'object' && item.transaction_type !== null) {
            return item.transaction_type.code === CLIENT_INCOME_CODE
          }

          // если transaction_type пришёл просто id, то пробуем найти тип в списке
          const type = state.transactionTypes.find(
            t => t.id === item.transaction_type
          )
          return type?.code === CLIENT_INCOME_CODE
        })
        .map(item => {
          const transactionType =
            typeof item.transaction_type === 'object'
              ? item.transaction_type
              : state.transactionTypes.find(t => t.id === item.transaction_type)

          const project = state.projects.find(p => p.id === item.project)
          const client = state.clients.find(c => c.id === item.counterparty)

          return {
            ...item,
            transaction_type_name: transactionType?.name || '—',
            transaction_type_code: transactionType?.code || '',
            project_name: project?.name || '—',
            counterparty_name: client?.name || '—',
          }
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  },

  actions: {
    async initPage() {
      this.loading = true
      try {
        const [transactions, transactionTypes, projects, clients] = await Promise.all([
          transactionsService.getTransactions(),
          transactionsService.getTransactionTypes(),
          projectsService.getProjects(),
          projectsService.getClients(),
        ])

        this.transactions = Array.isArray(transactions) ? transactions : []
        this.transactionTypes = Array.isArray(transactionTypes) ? transactionTypes : []
        this.projects = Array.isArray(projects) ? projects : []
        this.clients = Array.isArray(clients) ? clients : []
      } finally {
        this.loading = false
      }
    },

    async reloadTransactions() {
      const data = await transactionsService.getTransactions()
      this.transactions = Array.isArray(data) ? data : []
    },

    async createTransaction(payload) {
      this.saving = true
      try {
        const created = await transactionsService.createTransaction(payload)
        await this.reloadTransactions()
        return created
      } finally {
        this.saving = false
      }
    },

    async updateTransaction(id, payload) {
      this.saving = true
      try {
        const updated = await transactionsService.updateTransaction(id, payload)
        await this.reloadTransactions()
        return updated
      } finally {
        this.saving = false
      }
    },

    async deleteTransaction(id) {
      this.deletingId = id
      try {
        await transactionsService.deleteTransaction(id)
        this.transactions = this.transactions.filter(item => item.id !== id)
      } finally {
        this.deletingId = null
      }
    }
  }
})