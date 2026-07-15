import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useFactoriesStore } from '@/stores/factories.store'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getOperationTypes,
  createOperationType
} from '@/services/finance.service'

export function useProjectData() {
  const store = useProjectsStore()
  const factoriesStore = useFactoriesStore()
  const route = useRoute()
  
  const projectId = Number(route.params.id)
  const loading = ref(false)
  
  // Data refs
  const operationTypes = ref([])
  const transactions = ref([])

  // Computed data from store
  const project = computed(() => store.currentProject)
  const projectInfo = computed(() => store.currentProjectInfo)
  const finance = computed(() => store.currentProjectFinance)
  const itemsRows = computed(() => store.currentProjectItemsRows)
  const clients = computed(() => store.clients)
  const managers = computed(() => store.managers)
  const statuses = computed(() => store.statuses)
  
  const factories = computed(() => {
    const items = factoriesStore.items
    if (!Array.isArray(items)) return []
    return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  })

  const planned = computed(() => finance.value?.planned || {})
  const fact = computed(() => finance.value?.fact || {})
  const cashflow = computed(() => finance.value?.cashflow || {})

  // Helpers for types
  function getTypeId(code) {
    const list = Array.isArray(operationTypes.value) ? operationTypes.value : []
    return list.find(t => t.code === code)?.id
  }

  function getOperationTypeName(typeId) {
    const list = Array.isArray(operationTypes.value) ? operationTypes.value : []
    return list.find(t => t.id === typeId)?.name || '—'
  }

  // Filtered Transactions
  const projectExpenses = computed(() => {
    const typeId = getTypeId('project_expense')
    if (!typeId) return []
    return transactions.value.filter(
      t => t.project === projectId && t.finance_operation_type === typeId
    )
  })

  const CLIENT_PAYMENT_TYPE_ID = 1
  const FACTORY_PAYMENT_TYPE_ID = 2

  const clientPayments = computed(() =>
    transactions.value.filter(
      t => t.project === projectId && t.finance_operation_type === CLIENT_PAYMENT_TYPE_ID
    )
  )

  const factoryPayments = computed(() =>
    transactions.value.filter(
      t => t.project === projectId && t.finance_operation_type === FACTORY_PAYMENT_TYPE_ID
    )
  )

  // Actions
  async function refreshAllData() {
    try {
      await store.initProjectDetails(projectId)
      await loadTransactions()
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    }
  }

  async function loadOperationTypes() {
    const res = await getOperationTypes()
    operationTypes.value = Array.isArray(res)
      ? res
      : Array.isArray(res?.results) ? res.results : Array.isArray(res?.items) ? res.items : []
  }

  async function loadTransactions() {
    const res = await getTransactions()
    transactions.value = Array.isArray(res)
      ? res
      : Array.isArray(res?.results) ? res.results : Array.isArray(res?.items) ? res.items : []
  }

  async function init() {
    loading.value = true
    try {
      await store.initProjectDetails(projectId)
      await loadOperationTypes()
      await loadTransactions()
      await factoriesStore.fetchFactories()
    } catch (error) {
      console.error('❌ Error during initialization:', error)
    } finally {
      loading.value = false
    }
  }

  // Formatters & Utils
  function getStatusSeverity(statusId) {
    const status = store.statuses?.find(s => s.id === statusId)
    const name = (status?.name || '').toLowerCase()
    if (name.includes('работ') || name.includes('process') || name.includes('active')) return 'info'
    if (name.includes('заверш') || name.includes('done')) return 'success'
    if (name.includes('нов') || name.includes('draft')) return 'secondary'
    if (name.includes('отмен') || name.includes('cancel')) return 'danger'
    return 'info'
  }

  function getMarginSeverity(value) {
    if (value === null || value === undefined) return 'info'
    const num = Number(value)
    if (Number.isNaN(num)) return 'info'
    if (num > 20) return 'success'
    if (num > 10) return 'warning'
    return 'danger'
  }

  function formatMoney(value) {
    if (value === null || value === undefined || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return value
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('ru-RU')
  }
  
  function getFactoryName(factoryId) {
    if (!factoryId) return '—'
    const factory = factories.value.find(f => f.id === factoryId)
    return factory ? factory.name : 'Неизвестная фабрика'
  }

  // Transaction CRUD helpers
  async function createExpense(amount, date) {
    let typeId = getTypeId('project_expense')
    if (!typeId) {
      const created = await createOperationType({ name: 'Project expense', code: 'project_expense' })
      operationTypes.value = [...operationTypes.value, created]
      typeId = created.id
    }
    const dateString = date ? new Date(date).toISOString().split('T')[0] : null
    await createTransaction({
      amount: Number(amount),
      date: dateString,
      project: projectId,
      counterparty: null,
      finance_operation_type: typeId
    })
    await refreshAllData()
  }

  async function deleteExpense(id) {
    await deleteTransaction(id)
    await refreshAllData()
  }

  async function createClientPayment(amount, date) {
    const projectClientId = store.currentProject?.client || null
    const dateString = date ? new Date(date).toISOString().split('T')[0] : null
    await createTransaction({
      project: projectId,
      counterparty: projectClientId,
      finance_operation_type: CLIENT_PAYMENT_TYPE_ID,
      date: dateString,
      amount: Number(amount)
    })
    await refreshAllData()
  }

  async function deleteClientPayment(id) {
    await deleteTransaction(id)
    await refreshAllData()
  }

  async function createFactoryPayment(counterpartyId, amount, date) {
    const dateString = date ? new Date(date).toISOString().split('T')[0] : null
    await createTransaction({
      project: projectId,
      counterparty: counterpartyId ? Number(counterpartyId) : null,
      finance_operation_type: FACTORY_PAYMENT_TYPE_ID,
      date: dateString,
      amount: Number(amount)
    })
    await refreshAllData()
  }

  async function deleteFactoryPayment(id) {
    await deleteTransaction(id)
    await refreshAllData()
  }

  onMounted(init)
  onBeforeUnmount(() => store.clearCurrentProject())

  return {
    loading,
    project,
    projectInfo,
    itemsRows,
    clients,
    managers,
    statuses,
    factories,
    planned,
    fact,
    cashflow,
    projectExpenses,
    clientPayments,
    factoryPayments,
    
    // Methods
    refreshAllData,
    getStatusSeverity,
    getMarginSeverity,
    formatMoney,
    formatDate,
    getFactoryName,
    getOperationTypeName,
    
    // Transaction Actions
    createExpense,
    deleteExpense,
    createClientPayment,
    deleteClientPayment,
    createFactoryPayment,
    deleteFactoryPayment,
    
    // Store access for modals
    store,
    factoriesStore
  }
}