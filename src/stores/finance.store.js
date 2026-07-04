import { defineStore } from 'pinia'
import { getFinanceReport } from '@/services/finance.service'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    report: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchReport() {
      this.loading = true
      this.error = null

      try {
        this.report = await getFinanceReport()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})