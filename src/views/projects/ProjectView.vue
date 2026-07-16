<template>
  <div class="project-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="page-header__left">
        <Button 
          label="Назад к проектам" 
          icon="pi pi-arrow-left"
          @click="goBack" 
          class="p-button-text"
        />

        <div>
          <h1 class="page-title">{{ projectInfo?.name || 'Проект' }}</h1>
          <div class="page-subtitle">
            <Tag 
              v-if="projectInfo"
              :value="projectInfo.status_name"
              :severity="getStatusSeverity(projectInfo.status)"
              :rounded="true"
            />
          </div>
        </div>
      </div>

      <div class="page-header__right">
        <Button 
          label="Редактировать проект" 
          icon="pi pi-pencil"
          @click="openEditProject" 
        />
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
      <span>Загрузка проекта...</span>
    </div>

    <template v-else-if="projectInfo">
      <div class="project-layout">

        <!-- LEFT MAIN CONTENT -->
        <div class="project-main">

          <!-- INFO -->
          <ProjectInfoCard 
            :project-info="projectInfo"
            :get-status-severity="getStatusSeverity"
            :format-date="formatDate"
          />
          
          <!-- ITEMS -->
          <ProjectItemsTable
            :items-rows="itemsRows"
            :format-money="formatMoney"
            :store="store"
            :refresh-all-data="refreshAllData"
          />

                    <!-- PROJECT EXPENSES -->
          <!-- PROJECT EXPENSES -->
<TransactionsList
  title="Проектные расходы"
  subtitle="Расходы, привязанные к проекту"
  add-button-label="Добавить расход"
  :items="projectExpenses"
  :columns="[
    { 
      header: 'Описание', 
      render: (data) => data.name || getOperationTypeName(data.finance_operation_type) 
    },
    { 
      field: 'date', 
      header: 'Дата', 
      render: (data) => formatDate(data.date) 
    },
    { 
      field: 'amount', 
      header: 'Сумма', 
      render: (data) => `<span class='text-negative'>${formatMoney(data.amount)}</span>` 
    }
  ]"
  empty-icon="pi pi-credit-card"
  empty-title="Нет расходов"
  empty-description="Добавьте первый проектный расход"
  @add="openExpenseModal"
  @delete="deleteExpense"
/>

          <!-- CLIENT PAYMENTS -->
          <TransactionsList
            title="Оплаты клиентов"
            subtitle="Поступления от клиента по этому проекту"
            add-button-label="Добавить оплату"
            :items="clientPayments"
            :columns="[
              { field: 'date', header: 'Дата', render: (data) => formatDate(data.date) },
              { field: 'amount', header: 'Сумма', render: (data) => `<span class='text-positive'>${formatMoney(data.amount)}</span>` }
            ]"
            empty-icon="pi pi-money-bill"
            empty-title="Нет оплат клиента"
            empty-description="Добавьте первую оплату клиента"
            @add="openClientPaymentModal"
            @delete="deleteClientPayment"
          />

          <!-- FACTORY PAYMENTS -->
          <TransactionsList
            title="Оплаты фабрикам"
            subtitle="Платежи фабрикам по этому проекту"
            add-button-label="Добавить оплату"
            :items="factoryPayments"
            :columns="[
              { header: 'Фабрика', render: (data) => getFactoryName(data.counterparty) },
              { field: 'date', header: 'Дата', render: (data) => formatDate(data.date) },
              { field: 'amount', header: 'Сумма', render: (data) => `<span class='text-negative'>${formatMoney(data.amount)}</span>` }
            ]"
            empty-icon="pi pi-building"
            empty-title="Нет оплат фабрикам"
            empty-description="Добавьте первую оплату фабрике"
            @add="openFactoryPaymentModal"
            @delete="deleteFactoryPayment"
          />

        </div>

        <!-- RIGHT SIDEBAR -->
        <aside class="project-sidebar">
          <FinancialSummary
            :planned="planned"
            :fact="fact"
            :cashflow="cashflow"
            :format-money="formatMoney"
            :get-margin-severity="getMarginSeverity"
          />
        </aside>

      </div>
    </template>

    <!-- MODALS -->
    
    <!-- EDIT PROJECT -->
    <EditProjectModal
      v-model:visible="showProjectModal"
      :project="project"
      :project-info="projectInfo"
      :clients="clients"
      :managers="managers"
      :statuses="statuses"
      :store="store"
      @saved="refreshAllData"
    />

    <!-- SIMPLE TRANSACTION MODALS (Expense, Client Payment, Factory Payment) -->
    <!-- Для простоты можно сделать один универсальный или отдельные, как ниже -->
    
    <!-- НОВАЯ МОДАЛКА ДЛЯ РАСХОДОВ -->
    <ProjectExpenseModal
      v-model:visible="showExpenseModal"
      @save="saveExpense"
    />

    <SimpleTransactionModal
      v-model:visible="showClientPaymentModal"
      title="Оплата клиента"
      @save="saveClientPayment"
    />

    <FactoryPaymentModal
      v-model:visible="showFactoryPaymentModal"
      :factories="factories"
      :factories-store="factoriesStore"
      @save="saveFactoryPayment"
    />

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

// Components
import ProjectInfoCard from './components/ProjectInfoCard.vue'
import ProjectItemsTable from './components/ProjectItemsTable.vue'
import TransactionsList from './components/TransactionsList.vue'
import FinancialSummary from './components/FinancialSummary.vue'

// Modals
import EditProjectModal from './components/modals/EditProjectModal.vue'
import SimpleTransactionModal from './components/modals/SimpleTransactionModal.vue' // Создать ниже
import FactoryPaymentModal from './components/modals/FactoryPaymentModal.vue' // Создать ниже
import ProjectExpenseModal from './components/modals/ProjectExpenseModal.vue' 

// Composable
import { useProjectData } from './composables/useProjectData'

const router = useRouter()
const {
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
  store,
  factoriesStore,
  refreshAllData,
  getStatusSeverity,
  getMarginSeverity,
  formatMoney,
  formatDate,
  getFactoryName,
  getOperationTypeName,
  createExpense,
  deleteExpense,
  createClientPayment,
  deleteClientPayment,
  createFactoryPayment,
  deleteFactoryPayment
} = useProjectData()

/* ===================== */
/* MODAL STATES & HANDLERS */
/* ===================== */

// Edit Project
const showProjectModal = ref(false)
function openEditProject() {
  showProjectModal.value = true
}

// Expense
const showExpenseModal = ref(false)
function openExpenseModal() {
  showExpenseModal.value = true
}
// async function saveExpense(formData) {
//   try {
//     await createExpense(formData.amount, formData.date)
//     showExpenseModal.value = false
//   } catch (e) {
//     alert('Ошибка сохранения')
//   }
// }

// Client Payment
const showClientPaymentModal = ref(false)
function openClientPaymentModal() {
  showClientPaymentModal.value = true
}
async function saveClientPayment(formData) {
  try {
    await createClientPayment(formData.amount, formData.date)
    showClientPaymentModal.value = false
  } catch (e) {
    alert('Ошибка сохранения')
  }
}

// Factory Payment
const showFactoryPaymentModal = ref(false)
function openFactoryPaymentModal() {
  showFactoryPaymentModal.value = true
}
async function saveFactoryPayment(formData) {
  try {
    await createFactoryPayment(formData.counterparty, formData.amount, formData.date)
    showFactoryPaymentModal.value = false
  } catch (e) {
    alert('Ошибка сохранения')
  }
}

function goBack() {
  router.push('/projects')
}

async function saveExpense(formData) {
  try {
    // formData содержит { name, date, amount }
    await createExpense(formData.amount, formData.date, formData.operationTypeId)
    showExpenseModal.value = false
  } catch (e) {
    alert(e.message || 'Ошибка сохранения')
  }
}
</script>

<style scoped>
.project-page {
  padding: 1.5rem;
  background-color: #f8f9fa; /* Light gray background for the whole page */
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.page-subtitle {
  margin-top: 0.25rem;
}

/* Main Layout Grid */
.project-layout {
  display: grid;
  grid-template-columns: 1fr 380px; /* Main content | Sidebar */
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .project-layout {
    grid-template-columns: 1fr; /* Stack on tablet/mobile */
  }
  
  .project-sidebar {
    order: -1; /* Sidebar on top on mobile if needed, or remove to keep bottom */
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
  gap: 1rem;
}

/* Common Card Styles Overrides if needed */
:deep(.p-card) {
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: none;
}

:deep(.card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

:deep(.card-title) {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

:deep(.card-subtitle) {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #666;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state h4 {
  margin: 0.5rem 0 0.25rem 0;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style>