// src/stores/projects.js
import { defineStore } from 'pinia'
import { projectsService } from '@/services/projects.service'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    clients: [],
    managers: [],
    statuses: [],
    nomenclatures: [],

    loading: false,
    saving: false,
    detailsLoading: false,

    currentProject: null,
    currentProjectFinance: null,
    currentProjectItems: [],
    currentProjectExpenses: [],

    activeStatusId: 'all',
    deletingProjectItemId: null,
  }),

  getters: {
    clientsMap(state) {
      return state.clients.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    managersMap(state) {
      return state.managers.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    statusesMap(state) {
      return state.statuses.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    nomenclaturesMap(state) {
      return state.nomenclatures.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
    },

    enrichedProjects(state) {
      return state.projects.map(project => ({
        ...project,
        client_name: state.clients.find(c => c.id === project.client)?.name || '—',
        manager_name: state.managers.find(m => m.id === project.tech_manager)?.full_name || '—',
        status_name: state.statuses.find(s => s.id === project.status)?.name || `#${project.status}`,
      }))
    },

    filteredProjects() {
      if (this.activeStatusId === 'all') return this.enrichedProjects
      return this.enrichedProjects.filter(project => project.status === this.activeStatusId)
    },

    statusTiles() {
      const total = this.projects.length
      const dynamicStatuses = this.statuses.map(status => ({
        id: status.id,
        name: status.name,
        count: this.projects.filter(project => project.status === status.id).length
      }))

      return [{ id: 'all', name: 'Все', count: total }, ...dynamicStatuses]
    },

    projectTableRows() {
      return this.filteredProjects.map(project => ({
        ...project,
        amount: project.amount ?? '—',
        margin_value: project.margin_value ?? '—',
        paid: project.paid ?? '—',
        deadline: project.deadline ?? '—',
      }))
    },

    currentProjectInfo(state) {
      if (!state.currentProject) return null

      const project = state.currentProject

      return {
        ...project,
        client_name: state.clients.find(c => c.id === project.client)?.name || '—',
        manager_name: state.managers.find(m => m.id === project.tech_manager)?.full_name || '—',
        status_name: state.statuses.find(s => s.id === project.status)?.name || `#${project.status}`,
      }
    },

    currentProjectItemsRows(state) {
      return state.currentProjectItems.map(item => {
        const nomenclature = state.nomenclatures.find(n => n.id === item.nomenclature)

        const qty = Number(item.quantity || 0)
        const salePrice = Number(item.fixed_sale_price || 0)

        return {
          ...item,
          nomenclature_name: nomenclature?.name || `Товар #${item.nomenclature}`,
          total_amount: Number.isFinite(qty * salePrice) ? qty * salePrice : 0,
        }
      })
    }
  },

  actions: {
    setActiveStatus(statusId) {
      this.activeStatusId = statusId
    },

    async safeLoadStatuses() {
      try {
        return await projectsService.getProjectStatuses()
      } catch (e) {
        return []
      }
    },

    async initProjectsPage() {
      this.loading = true
      try {
        const [projects, clients, managers, statuses] = await Promise.all([
          projectsService.getProjects(),
          projectsService.getClients(),
          projectsService.getTechnicalManagers(),
          this.safeLoadStatuses()
        ])

        this.projects = projects
        this.clients = clients
        this.managers = managers
        this.statuses = statuses
      } finally {
        this.loading = false
      }
    },

    async createProject(payload) {
      this.saving = true
      try {
        const created = await projectsService.createProject(payload)
        this.projects.unshift(created)
        return created
      } finally {
        this.saving = false
      }
    },

    async updateProject(id, payload) {
      this.saving = true
      try {
        const updated = await projectsService.updateProject(id, payload)

        this.currentProject = updated

        const listIndex = this.projects.findIndex(item => item.id === id)
        if (listIndex !== -1) {
          this.projects[listIndex] = updated
        }

        return updated
      } finally {
        this.saving = false
      }
    },

    async createClient(payload) {
      const created = await projectsService.createClient(payload)
      this.clients.push(created)
      return created
    },

    async createTechnicalManager(payload) {
      const created = await projectsService.createTechnicalManager(payload)
      this.managers.push(created)
      return created
    },

    async initProjectDetails(projectId) {
      this.detailsLoading = true
      try {
        const [project, finance, expenses, items, clients, managers, statuses, nomenclatures] =
          await Promise.all([
            projectsService.getProjectById(projectId),
            projectsService.getProjectFinance(projectId),
            projectsService.getProjectExpenseTransactions(projectId),
            projectsService.getProjectItems(projectId),
            this.clients.length ? Promise.resolve(this.clients) : projectsService.getClients(),
            this.managers.length ? Promise.resolve(this.managers) : projectsService.getTechnicalManagers(),
            this.statuses.length ? Promise.resolve(this.statuses) : this.safeLoadStatuses(),
            this.nomenclatures.length ? Promise.resolve(this.nomenclatures) : projectsService.getNomenclatures(),
          ])

        this.currentProject = project
        this.currentProjectFinance = finance
        this.currentProjectExpenses = expenses
        this.currentProjectItems = items

        this.clients = clients
        this.managers = managers
        this.statuses = statuses
        this.nomenclatures = nomenclatures
      } finally {
        this.detailsLoading = false
      }
    },

    async createProjectItem(payload) {
      this.saving = true
      try {
        const created = await projectsService.createProjectItem(payload)
        this.currentProjectItems.push(created)
        return created
      } finally {
        this.saving = false
      }
    },

    async updateProjectItem(id, payload) {
      this.saving = true
      try {
        const updated = await projectsService.updateProjectItem(id, payload)
        const index = this.currentProjectItems.findIndex(item => item.id === id)
        if (index !== -1) {
          this.currentProjectItems[index] = updated
        }
        return updated
      } finally {
        this.saving = false
      }
    },

    async deleteProjectItem(id) {
      this.deletingProjectItemId = id
      try {
        await projectsService.deleteProjectItem(id)
        this.currentProjectItems = this.currentProjectItems.filter(item => item.id !== id)
      } finally {
        this.deletingProjectItemId = null
      }
    },

    clearCurrentProject() {
      this.currentProject = null
      this.currentProjectFinance = null
      this.currentProjectItems = []
      this.currentProjectExpenses = []
    }
  }
})