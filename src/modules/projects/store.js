import { defineStore } from 'pinia'
import { projectsApi } from './api'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    projectItems: [],
    statuses: [],
    managers: [],
    clients: [],
    nomenclatures: [],
    factories: [],
    locations: [],

    clientPayments: [],
    factoryPayments: [],
    projectExpenses: [],
    expenseTypes: [], // Добавляем список типов расходов

    count: 0,
    next: null,
    previous: null,
    loading: false,
    error: null,
  }),

  getters: {
    statusName: (state) => (id) => {
      const s = state.statuses.find((x) => x.id === Number(id))
      return s ? s.name : `#${id}`
    },
    clientName: (state) => (id) => {
      const c = state.clients.find((x) => x.id === Number(id))
      return c ? c.name : `#${id}`
    },
    managerName: (state) => (id) => {
      const m = state.managers.find((x) => x.id === Number(id))
      return m ? m.full_name : '—'
    },
    nomenclatureName: (state) => (id) => {
      const n = state.nomenclatures.find((x) => x.id === Number(id))
      return n ? n.name : `#${id}`
    },
    nomenclatureById: (state) => (id) =>
      state.nomenclatures.find((x) => x.id === Number(id)) || null,
    factoryName: (state) => (id) => {
      const f = state.factories.find((x) => x.id === Number(id))
      return f ? f.name : `#${id}`
    },
    // Геттер для получения списка имен типов расходов (для автодополнения)
    expenseTypeNames: (state) => {
      return state.expenseTypes.map(t => t.name)
    },
  },

  actions: {
    setError(e) {
      this.error = e?.response?.data ?? e?.message ?? String(e)
    },

    // ---- Projects ----
    async fetchProjects(params = {}) {
      this.loading = true
      this.error = null
      try {
        const data = await projectsApi.getProjects(params)
        this.projects = data.results ?? []
        this.count = data.count ?? this.projects.length
        this.next = data.next ?? null
        this.previous = data.previous ?? null
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchProject(id) {
      this.loading = true
      this.error = null
      try {
        this.currentProject = await projectsApi.getProject(id)
        return this.currentProject
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createProject(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await projectsApi.createProject(payload)
        this.projects.unshift(created)
        this.count += 1
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateProject(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await projectsApi.updateProject(id, payload)
        if (this.currentProject?.id === id) this.currentProject = updated
        const idx = this.projects.findIndex((p) => p.id === id)
        if (idx !== -1) this.projects[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteProject(id) {
      this.loading = true
      this.error = null
      try {
        await projectsApi.deleteProject(id)
        this.projects = this.projects.filter((p) => p.id !== id)
        this.count = Math.max(0, this.count - 1)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Project items ----
    async fetchProjectItems(projectId) {
      this.loading = true
      this.error = null
      try {
        const data = await projectsApi.getProjectItems(projectId)
        this.projectItems = data ?? []
        return this.projectItems
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async createProjectItem(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await projectsApi.createProjectItem(payload)
        this.projectItems.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateProjectItem(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await projectsApi.updateProjectItem(id, payload)
        const idx = this.projectItems.findIndex((i) => i.id === id)
        if (idx !== -1) this.projectItems[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteProjectItem(id) {
      this.loading = true
      this.error = null
      try {
        await projectsApi.deleteProjectItem(id)
        this.projectItems = this.projectItems.filter((i) => i.id !== id)
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Справочники ----
    async fetchStatuses() {
      try {
        this.statuses = await projectsApi.getProjectStatuses()
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchManagers() {
      try {
        this.managers = await projectsApi.getTechnicalManagers()
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchClients() {
      try {
        const data = await projectsApi.getCounterparties({ type: 'CLIENT' })
        this.clients = data.results ?? data
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchNomenclatures() {
      try {
        const data = await projectsApi.getNomenclatures()
        this.nomenclatures = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchFactories() {
      try {
        const data = await projectsApi.getFactories()
        this.factories = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchLocations() {
      try {
        const data = await projectsApi.getLocations()
        this.locations = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Fetch expense types (типы расходов) ----
    async fetchExpenseTypes() {
      try {
        // Получаем все типы операций с кодом PROJECT_EXPENSE
        const data = await projectsApi.getFinanceOperationTypes({ code: 'project_expense' })
        this.expenseTypes = data.results ?? data ?? []
      } catch (e) {
        console.error('Error fetching expense types:', e)
        this.expenseTypes = []
      }
    },

    async createNomenclature(payload) {
      try {
        const created = await projectsApi.createNomenclature(payload)
        this.nomenclatures.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async createFactory(payload) {
      try {
        const created = await projectsApi.createFactory(payload)
        this.factories.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Finance operations for current project ----
    async fetchClientPayments(projectId) {
      try {
        const data = await projectsApi.getClientPayments({ project_id: projectId })
        this.clientPayments = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async createClientPayment(payload) {
      try {
        const created = await projectsApi.createClientPayment(payload)
        this.clientPayments.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchFactoryPayments(projectId) {
      try {
        const data = await projectsApi.getFactoryPayments({ project_id: projectId })
        this.factoryPayments = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async createFactoryPayment(payload) {
      try {
        const created = await projectsApi.createFactoryPayment(payload)
        this.factoryPayments.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async fetchProjectExpenses(projectId) {
      try {
        const data = await projectsApi.getProjectExpenses({ project_id: projectId })
        this.projectExpenses = data.results ?? []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
    async createProjectExpense(payload) {
      try {
        const created = await projectsApi.createProjectExpense(payload)
        this.projectExpenses.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
  },
})