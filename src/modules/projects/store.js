// modules/projects/store/index.js

import { defineStore } from 'pinia'
import { projectsApi } from '@/modules/projects/api'

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

    projectFiles: [],

    clientPayments: [],
    factoryPayments: [],
    projectExpenses: [],
    expenseTypes: [],

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
      return m ? m.first_name : '—'
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
    expenseTypeNames: (state) => {
      return state.expenseTypes.map(t => t.name)
    },
  },

  actions: {
    setError(e) {
      this.error = e?.response?.data ?? e?.message ?? String(e)
    },
    // ---- Project files ----

async fetchProjectFiles(projectId) {
  try {
    const data = await projectsApi.getProjectFiles(projectId)

    this.projectFiles = data.results ?? data ?? []

    return this.projectFiles
  } catch (e) {
    this.setError(e)
    throw e
  }
},

async uploadProjectFile(
  projectId,
  file,
  name = '',
  description = ''
) {
  this.loading = true
  this.error = null

  try {
    const formData = new FormData()

    formData.append('file', file)

    if (name) {
      formData.append('name', name)
    }

    if (description) {
      formData.append('description', description)
    }

    const created = await projectsApi.uploadProjectFile(
      projectId,
      formData
    )

    this.projectFiles.unshift(created)

    return created
  } catch (e) {
    this.setError(e)
    throw e
  } finally {
    this.loading = false
  }
},

async deleteProjectFile(projectId, fileId) {
  this.loading = true
  this.error = null

  try {
    await projectsApi.deleteProjectFile(
      projectId,
      fileId
    )

    this.projectFiles = this.projectFiles.filter(
      file => file.id !== fileId
    )

    return true
  } catch (e) {
    this.setError(e)
    throw e
  } finally {
    this.loading = false
  }
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
  console.log(`🔍 fetchProjectItems: projectId=${projectId}`)
  this.loading = true
  this.error = null
  try {
    const data = await projectsApi.getProjectItems(projectId)
    console.log('📋 API /items/ response:', data)
    this.projectItems = data ?? []
    console.log('📋 projectItems set:', this.projectItems)
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
  console.log('🔍 fetchNomenclatures called')
  try {
    const data = await projectsApi.getNomenclatures()
    console.log('📦 API /nomenclatures/ response:', data)
    console.log('📦 results:', data.results)
    this.nomenclatures = data.results ?? []
    console.log('📦 nomenclatures set:', this.nomenclatures)
    console.log('📊 Count:', this.nomenclatures.length)
  } catch (e) {
    this.setError(e)
    throw e
  }
},
async fetchFactories() {
  console.log('🔍 fetchFactories called')
  try {
    const data = await projectsApi.getFactories()
    console.log('🏭 API /factories/ response:', data)
    this.factories = data.results ?? []
    console.log('🏭 factories set:', this.factories)
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
    // Добавьте этот метод для принудительного обновления
async refreshAllData(projectId) {
  console.log('🔄 refreshAllData called for project:', projectId)
  await Promise.all([
    this.fetchNomenclatures(),
    this.fetchProjectItems(projectId),
    this.fetchFactories()
  ])
  console.log('✅ All data refreshed')
},

    // ---- CRUD для клиентов (Counterparty) ----
    async createCounterparty(payload) {
      try {
        const created = await projectsApi.createCounterparty(payload)
        this.clients.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- CRUD для менеджеров (TechnicalManager) ----
    async createTechnicalManager(payload) {
      try {
        const created = await projectsApi.createTechnicalManager(payload)
        this.managers.unshift(created)
        return created
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Автокомплит ----
    async autocompleteClients(query = '') {
      try {
        const data = await projectsApi.autocompleteClients(query)
        return data || []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async autocompleteManagers(query = '') {
      try {
        const data = await projectsApi.autocompleteManagers(query)
        return data || []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async autocompleteLocations(query = '') {
      try {
        const data = await projectsApi.autocompleteLocations(query)
        return data || []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Fetch expense types ----
    async fetchExpenseTypes() {
      try {
        const data = await projectsApi.getFinanceOperationTypes({ code: 'project_expense' })
        this.expenseTypes = data.results ?? data ?? []
      } catch (e) {
        console.error('Error fetching expense types:', e)
        this.expenseTypes = []
      }
    },

    // ---- Номенклатура ----
async createNomenclature(payload) {
  console.log('🔍 createNomenclature called with:', payload)
  try {
    const created = await projectsApi.createNomenclature(payload)
    console.log('✅ Created nomenclature:', created)
    this.nomenclatures.unshift(created)
    console.log('📦 nomenclatures after unshift:', this.nomenclatures)
    return created
  } catch (e) {
    this.setError(e)
    throw e
  }
},

    async updateNomenclature(id, payload) {
      try {
        const updated = await projectsApi.updateNomenclature(id, payload)
        const idx = this.nomenclatures.findIndex((n) => n.id === id)
        if (idx !== -1) this.nomenclatures[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async deleteNomenclature(id) {
      try {
        await projectsApi.deleteNomenclature(id)
        this.nomenclatures = this.nomenclatures.filter((n) => n.id !== id)
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async getNomenclature(id) {
      try {
        return await projectsApi.getNomenclature(id)
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Фабрики ----
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

    async updateFactory(id, payload) {
      try {
        const updated = await projectsApi.updateFactory(id, payload)
        const idx = this.factories.findIndex((f) => f.id === id)
        if (idx !== -1) this.factories[idx] = updated
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async deleteFactory(id) {
      try {
        await projectsApi.deleteFactory(id)
        this.factories = this.factories.filter((f) => f.id !== id)
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    // ---- Изображения номенклатуры ----
    async uploadNomenclatureImage(nomenclatureId, file, isMain = false, altText = '') {
      this.loading = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('nomenclature', nomenclatureId)
        formData.append('image', file)
        formData.append('is_main', isMain ? 'true' : 'false')
        if (altText) formData.append('alt_text', altText)
        
        const created = await projectsApi.uploadNomenclatureImage(formData)
        
        const idx = this.nomenclatures.findIndex((n) => n.id === nomenclatureId)
        if (idx !== -1) {
          if (!this.nomenclatures[idx].images) {
            this.nomenclatures[idx].images = []
          }
          this.nomenclatures[idx].images.push(created)
        }
        
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteNomenclatureImage(imageId) {
      this.loading = true
      this.error = null
      try {
        await projectsApi.deleteNomenclatureImage(imageId)
        
        this.nomenclatures.forEach(n => {
          if (n.images) {
            n.images = n.images.filter(img => img.id !== imageId)
          }
        })
        
        return true
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async setMainNomenclatureImage(imageId) {
      this.loading = true
      this.error = null
      try {
        const updated = await projectsApi.setMainNomenclatureImage(imageId)
        
        this.nomenclatures.forEach(n => {
          if (n.images) {
            n.images = n.images.map(img => ({
              ...img,
              is_main: img.id === imageId
            }))
          }
        })
        
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateNomenclatureImage(imageId, data) {
      this.loading = true
      this.error = null
      try {
        const updated = await projectsApi.updateNomenclatureImage(imageId, data)
        
        this.nomenclatures.forEach(n => {
          if (n.images) {
            const idx = n.images.findIndex(img => img.id === imageId)
            if (idx !== -1) {
              n.images[idx] = { ...n.images[idx], ...updated }
            }
          }
        })
        
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    // ---- Файлы номенклатуры ----
    async uploadNomenclatureFile(nomenclatureId, file, name = '', description = '') {
      this.loading = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('nomenclature', nomenclatureId)
        formData.append('file', file)
        if (name) formData.append('name', name)
        if (description) formData.append('description', description)
        
        const created = await projectsApi.uploadNomenclatureFile(formData)
        
        const idx = this.nomenclatures.findIndex((n) => n.id === nomenclatureId)
        if (idx !== -1) {
          if (!this.nomenclatures[idx].files) {
            this.nomenclatures[idx].files = []
          }
          this.nomenclatures[idx].files.push(created)
        }
        
        return created
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteNomenclatureFile(fileId) {
      this.loading = true
      this.error = null
      try {
        await projectsApi.deleteNomenclatureFile(fileId)
        
        this.nomenclatures.forEach(n => {
          if (n.files) {
            n.files = n.files.filter(f => f.id !== fileId)
          }
        })
        
        return true
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateNomenclatureFile(fileId, data) {
      this.loading = true
      this.error = null
      try {
        const updated = await projectsApi.updateNomenclatureFile(fileId, data)
        
        this.nomenclatures.forEach(n => {
          if (n.files) {
            const idx = n.files.findIndex(f => f.id === fileId)
            if (idx !== -1) {
              n.files[idx] = { ...n.files[idx], ...updated }
            }
          }
        })
        
        return updated
      } catch (e) {
        this.setError(e)
        throw e
      } finally {
        this.loading = false
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

    // ---- История изменений ----
    async fetchProjectHistory(projectId) {
      try {
        const response = await projectsApi.getProjectHistory(projectId)
        return response || []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },

    async fetchStatusHistory(statusId) {
      try {
        const response = await projectsApi.getStatusHistory(statusId)
        return response.results || []
      } catch (e) {
        this.setError(e)
        throw e
      }
    },
  },
})