import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useFactoriesStore } from '@/stores/factories.store'
import { useFinanceStore } from '@/stores/finance.store' // Добавлен импорт
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
} from '@/services/finance.service'

export function useProjectData() {
  const store = useProjectsStore()
  const factoriesStore = useFactoriesStore()
  const financeStore = useFinanceStore() // Инициализация стора финансов
  const route = useRoute()
  
  const projectId = Number(route.params.id)
  const loading = ref(false)
  
  // Данные транзакций храним локально, так как они часто меняются
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

  // === ЛОГИКА ТИПОВ ОПЕРАЦИЙ ===
  // Берем типы напрямую из стора, чтобы они обновлялись реактивно при создании новых
  const allOperationTypes = computed(() => financeStore.operationTypes || [])

  // Получаем массив ID всех типов с указанным кодом
  function getTypeIdsByCode(code) {
    return allOperationTypes.value
      .filter(t => t.code === code)
      .map(t => t.id)
  }

  function getOperationTypeName(typeId) {
    const type = allOperationTypes.value.find(t => t.id === typeId)
    return type ? type.name : '—'
  }

  // === ФИЛЬТРАЦИЯ ТРАНЗАКЦИЙ ===
  
  const projectExpenses = computed(() => {
    const expenseTypeIds = getTypeIdsByCode('project_expense')
    if (expenseTypeIds.length === 0) return []
    
    return transactions.value.filter(t => 
      t.project === projectId && 
      expenseTypeIds.includes(t.finance_operation_type)
    )
  })

  const clientPayments = computed(() => {
    const typeIds = getTypeIdsByCode('client_payment')
    if (typeIds.length === 0) return []
    return transactions.value.filter(t => 
      t.project === projectId && 
      typeIds.includes(t.finance_operation_type)
    )
  })

  const factoryPayments = computed(() => {
    const typeIds = getTypeIdsByCode('factory_payment')
    if (typeIds.length === 0) return []
    return transactions.value.filter(t => 
      t.project === projectId && 
      typeIds.includes(t.finance_operation_type)
    )
  })

  // === ACTIONS ===

  async function refreshAllData() {
    try {
      await store.initProjectDetails(projectId)
      await loadTransactions()
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    }
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
      
      // Загружаем типы операций, если они еще не загружены в сторе
      if (!financeStore.operationTypesLoaded) {
        await financeStore.fetchOperationTypes()
      }
      
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

  // ========================
  // TRANSACTION CRUD
  // ========================

  async function createExpense(amount, date, operationTypeId) {
    let formattedDate = null;
    if (date) {
      if (date instanceof Date) {
        formattedDate = date.toISOString().split('T')[0];
      } else if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          formattedDate = date;
        } else {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        }
      }
    }

    if (!formattedDate) {
      throw new Error('Дата обязательна');
    }
    
    if (!operationTypeId) {
       throw new Error('Тип операции не определен');
    }

    const projectId = route.params.id
    
    await createTransaction({
      project: projectId,
      amount: Math.abs(amount),
      date: formattedDate,
      finance_operation_type: operationTypeId,
      counterparty: null
    })
    
    await refreshAllData()
  }

  async function deleteExpense(id) {
    await deleteTransaction(id)
    await refreshAllData()
  }

  async function createClientPayment(amount, date) {
    const projectClientId = store.currentProject?.client || null
    const typeIds = getTypeIdsByCode('client_payment')
    const typeId = typeIds[0] // Берем первый попавшийся тип для клиентских оплат
    
    if (!typeId) throw new Error('Тип оплаты клиента не найден')

    const dateString = date ? new Date(date).toISOString().split('T')[0] : null
    
    await createTransaction({
      project: projectId,
      counterparty: projectClientId,
      finance_operation_type: typeId,
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
    const typeIds = getTypeIdsByCode('factory_payment')
    const typeId = typeIds[0]
    
    if (!typeId) throw new Error('Тип оплаты фабрике не найден')

    const dateString = date ? new Date(date).toISOString().split('T')[0] : null
    
    await createTransaction({
      project: projectId,
      counterparty: counterpartyId ? Number(counterpartyId) : null,
      finance_operation_type: typeId,
      date: dateString,
      amount: Math.abs(amount)
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