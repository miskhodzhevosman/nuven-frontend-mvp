// src/stores/finance.store.js
import { defineStore } from 'pinia'
import {
  getFinanceReport,
  getProjectFinanceReport,
  getOperationTypes // <-- Нужно добавить этот сервис
} from '@/services/finance.service'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    report: null,
    projectReport: null,

    // Новые поля для типов операций
    operationTypes: [],      // Массив объектов [{ id, name, code }]
    operationTypesLoaded: false,

    loading: false,
    projectLoading: false,
    typesLoading: false, // Флаг загрузки типов

    error: null,
    projectError: null,
  }),

  getters: {
    financeRowsMap(state) {
      const raw = state.report
      const rows =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.results) ? raw.results :
        Array.isArray(raw?.items) ? raw.items :
        Array.isArray(raw?.projects) ? raw.projects :
        []

      return rows.reduce((acc, row) => {
        const projectId = row.project_id ?? row.project ?? row.id
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

    // ✅ Новый геттер: Мапа типов операций для быстрого поиска по ID
    operationTypesMap(state) {
      return state.operationTypes.reduce((acc, type) => {
        acc[type.id] = type.name
        return acc
      }, {})
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

    // ✅ Новый экшен: Загрузка типов операций
    async fetchOperationTypes() {
      // Если уже загружены, не грузим повторно (опционально)
      if (this.operationTypesLoaded && this.operationTypes.length > 0) {
        return this.operationTypes
      }

      this.typesLoading = true
      try {
        const response = await getOperationTypes()
        // Предполагаем, что ответ имеет структуру { results: [...] } или просто массив
        const types = response.results || response
        this.operationTypes = types
        this.operationTypesLoaded = true
        return types
      } catch (e) {
        console.error('❌ Error loading operation types:', e)
        throw e
      } finally {
        this.typesLoading = false
      }
    },

    clearProjectReport() {
      this.projectReport = null
      this.projectError = null
    },
  },
})