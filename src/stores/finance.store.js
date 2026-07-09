// src/stores/finance.store.js
import { defineStore } from 'pinia'
import {
  getFinanceReport,
  getProjectFinanceReport,
} from '@/services/finance.service'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    report: null, // общий отчет для списка проектов
    projectReport: null, // отчет конкретного проекта

    loading: false,
    projectLoading: false,

    error: null,
    projectError: null,
  }),

  getters: {
    /**
     * Преобразуем общий отчет в map:
     * { [projectId]: financeRow }
     *
     * Поддерживает разные формы ответа:
     * - массив
     * - { results: [] }
     * - { items: [] }
     * - { projects: [] }
     */
    financeRowsMap(state) {
      const raw = state.report

      const rows =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.results) ? raw.results :
        Array.isArray(raw?.items) ? raw.items :
        Array.isArray(raw?.projects) ? raw.projects :
        []

      return rows.reduce((acc, row) => {
        const projectId =
          row.project_id ??
          row.project ??
          row.id

        if (!projectId) return acc

        acc[Number(projectId)] = row
        return acc
      }, {})
    },

    planned(state) {
      return state.projectReport?.planned || {}
    },

    fact(state) {
      return state.projectReport?.fact || {}
    },

    cashflow(state) {
      return state.projectReport?.cashflow || {}
    },

    netProfit(state) {
      return state.projectReport?.net_profit ?? 0
    },
  },

  actions: {
    async fetchReport() {
      this.loading = true
      this.error = null

      try {
        this.report = await getFinanceReport()
        return this.report
      } catch (e) {
        this.error = e?.message || 'Не удалось загрузить финансовый отчёт'
        console.error('❌ Finance report error:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProjectReport(projectId) {
      this.projectLoading = true
      this.projectError = null

      try {
        this.projectReport = await getProjectFinanceReport(projectId)
        return this.projectReport
      } catch (e) {
        this.projectError = e?.message || 'Не удалось загрузить финансовый отчёт проекта'
        console.error(`❌ Project ${projectId} finance report error:`, e)
        throw e
      } finally {
        this.projectLoading = false
      }
    },

    clearProjectReport() {
      this.projectReport = null
      this.projectError = null
    },
  },
})