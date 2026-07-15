<template>
  <div class="projects-page">
    <div class="page-header">
      <h1>Проекты</h1>
      <Button 
        label="Создать проект" 
        icon="pi pi-plus" 
        @click="openCreateModal"
        :disabled="store.loading"
        data-tour="project-create-btn"
      />
    </div>

    <!-- Теги/плитки статусов -->
    <div class="status-tiles">
      <Button
        v-for="tile in store.statusTiles"
        :key="tile.id"
        :label="`${tile.name} (${tile.count})`"
        :severity="store.activeStatusId === tile.id ? 'primary' : 'secondary'"
        :outlined="store.activeStatusId !== tile.id"
        size="small"
        class="status-tile-btn"
        @click="store.setActiveStatus(tile.id)"
      />
    </div>

    <!-- Таблица проектов -->
    <div class="table-wrapper">
      <DataTable
        :value="tableRows"
        :loading="store.loading || financeLoading"
        dataKey="id"
        class="p-datatable-sm"
        stripedRows
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords}"
        sortField="created_at" 
        :sortOrder="-1"
      >
        <!-- Остальные колонки без изменений -->
        <Column field="name" header="Проект" style="min-width: 150px">
          <template #body="{ data }">
            <Button 
              :label="data.name || '—'" 
              class="link-cell p-button-text" 
              @click="goToProject(data.id)"
            />
          </template>
        </Column>

        <Column field="client_name" header="Клиент">
          <template #body="{ data }">
            <span>{{ data.client_name || '—' }}</span>
          </template>
        </Column>

        <Column field="manager_name" header="Менеджер">
          <template #body="{ data }">
            <span>{{ data.manager_name || '—' }}</span>
          </template>
        </Column>

        <Column field="geography" header="Страна">
          <template #body="{ data }">
            <span>{{ data.geography || '—' }}</span>
          </template>
        </Column>

        <Column field="amount" header="Сумма">
          <template #body="{ data }">
            <span class="text-positive">{{ formatMoney(data.amount) }}</span>
          </template>
        </Column>

        <Column field="margin_value" header="Маржа">
          <template #body="{ data }">
            <Tag 
              :value="data.margin_value === '—' ? '—' : `${formatPercent(data.margin_value)}%`"
              :severity="getMarginSeverity(data.margin_value)"
              :rounded="true"
            />
          </template>
        </Column>

        <Column field="paid" header="Оплачено">
          <template #body="{ data }">
            <span>{{ formatMoney(data.paid) }}</span>
          </template>
        </Column>

        <Column field="deadline" header="Срок">
          <template #body="{ data }">
            <span>{{ formatDate(data.deadline) }}</span>
          </template>
        </Column>

        <Column field="status_name" header="Статус">
          <template #body="{ data }">
            <Tag 
              :value="data.status_name || '—'" 
              :severity="getStatusSeverity(data.status_name)"
              :rounded="true"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Модалка создания проекта -->
    <Dialog
      v-model:visible="showModal"
      header="Создать проект"
      :modal="true"
      :style="{ width: '600px' }"
      class="p-fluid"
      @hide="resetForm"
      data-tour="project=create-form"
    >
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="field">
            <label for="name">Название проекта <span class="req">*</span></label>
            <InputText
              id="name"
              v-model="form.name"
              placeholder="Введите название проекта"
              :class="{ 'p-invalid': errors.name }"
              required
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div class="field">
            <label for="geography">География</label>
            <InputText
              id="geography"
              v-model="form.geography"
              placeholder="Например: Казахстан"
            />
          </div>

          <div class="field">
            <label for="client">Клиент <span class="req">*</span></label>
            <div class="field-with-action">
              <Select
                id="client"
                v-model="form.client"
                :options="store.clients"
                optionLabel="name"
                optionValue="id"
                placeholder="Выберите клиента"
                :class="{ 'p-invalid': errors.client }"
                required
              />
              <Button 
                icon="pi pi-plus" 
                label="Новый"
                size="small"
                @click="openClientModal"
                class="action-btn"
              />
            </div>
            <small v-if="errors.client" class="p-error">{{ errors.client }}</small>
          </div>

          <div class="field">
            <label for="tech_manager">Тех. менеджер <span class="req">*</span></label>
            <div class="field-with-action">
              <Select
                id="tech_manager"
                v-model="form.tech_manager"
                :options="store.managers"
                optionLabel="full_name"
                optionValue="id"
                placeholder="Выберите менеджера"
                :class="{ 'p-invalid': errors.tech_manager }"
                required
              />
              <Button 
                icon="pi pi-plus" 
                label="Новый"
                size="small"
                @click="openManagerModal"
                class="action-btn"
              />
            </div>
            <small v-if="errors.tech_manager" class="p-error">{{ errors.tech_manager }}</small>
          </div>

          <div class="field">
            <label for="status">Статус <span class="req">*</span></label>
            <Select
              id="status"
              v-model="form.status"
              :options="store.statuses"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите статус"
              :class="{ 'p-invalid': errors.status }"
              required
            />
            <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
          </div>
        </div>

        <div v-if="errorMessage" class="p-message p-message-error">
          <i class="pi pi-exclamation-circle"></i>
          {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showModal = false" class="p-button-text" />
          <Button 
            label="Создать" 
            icon="pi pi-check" 
            type="submit" 
            :loading="store.saving"
            :disabled="store.saving"
          />
        </div>
      </form>
    </Dialog>

    <!-- Модалка создания клиента -->
    <Dialog
      v-model:visible="showClientModal"
      header="Создать клиента"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <form @submit.prevent="handleCreateClient">
        <div class="field">
          <label for="client-name">Название <span class="req">*</span></label>
          <InputText
            id="client-name"
            v-model="clientForm.name"
            required
          />
        </div>

        <div class="field">
          <label for="client-contacts">Контакты</label>
          <InputText
            id="client-contacts"
            v-model="clientForm.contacts"
          />
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showClientModal = false" class="p-button-text" />
          <Button label="Создать" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>

    <!-- Модалка создания менеджера -->
    <Dialog
      v-model:visible="showManagerModal"
      header="Создать тех. менеджера"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <form @submit.prevent="handleCreateManager">
        <div class="field">
          <label for="manager-name">ФИО <span class="req">*</span></label>
          <InputText
            id="manager-name"
            v-model="managerForm.full_name"
            required
          />
        </div>

        <div class="field">
          <label for="manager-contacts">Контакты</label>
          <InputText
            id="manager-contacts"
            v-model="managerForm.contacts"
          />
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showManagerModal = false" class="p-button-text" />
          <Button label="Создать" icon="pi pi-check" type="submit" data-tour="project-create-form-button"/>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useFinanceStore } from '@/stores/finance.store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const router = useRouter()
const store = useProjectsStore()
const financeStore = useFinanceStore()

const tableRows = ref([])
const financeLoading = ref(false)

const showModal = ref(false)
const showClientModal = ref(false)
const showManagerModal = ref(false)
const errorMessage = ref('')
const errors = reactive({})

const getInitialForm = () => ({
  name: '',
  geography: '',
  client: null,
  tech_manager: null,
  status: null,
})

const form = reactive(getInitialForm())

const clientForm = reactive({
  name: '',
  contacts: '',
})

const managerForm = reactive({
  full_name: '',
  contacts: '',
})

function resetForm() {
  Object.assign(form, getInitialForm())
  errorMessage.value = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

function openCreateModal() {
  resetForm()
  showModal.value = true
}

function openClientModal() {
  clientForm.name = ''
  clientForm.contacts = ''
  showClientModal.value = true
}

function openManagerModal() {
  managerForm.full_name = ''
  managerForm.contacts = ''
  showManagerModal.value = true
}

async function handleSubmit() {
  errorMessage.value = ''
  Object.keys(errors).forEach(key => delete errors[key])

  // Валидация
  if (!form.name.trim()) {
    errors.name = 'Введите название проекта'
    return
  }

  if (!form.client) {
    errors.client = 'Выберите клиента'
    return
  }

  if (!form.tech_manager) {
    errors.tech_manager = 'Выберите тех. менеджера'
    return
  }

  if (!form.status) {
    errors.status = 'Выберите статус'
    return
  }

  try {
    const payload = {
      name: form.name.trim(),
      geography: form.geography.trim(),
      client: Number(form.client),
      tech_manager: Number(form.tech_manager),
      status: Number(form.status),
    }

    await store.createProject(payload)
    showModal.value = false
    resetForm()

    await store.initProjectsPage()
  } catch (error) {
    errorMessage.value = error?.message || 'Не удалось создать проект'
    console.error('❌ Create project error:', error)
  }
}

async function handleCreateClient() {
  try {
    const created = await store.createClient({
      type: 'CLIENT',
      name: clientForm.name.trim(),
      contacts: clientForm.contacts.trim(),
    })

    form.client = created.id
    showClientModal.value = false
    await store.initProjectsPage()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: error?.message || 'Не удалось создать клиента',
      life: 3000 
    })
    console.error('❌ Create client error:', error)
  }
}

async function handleCreateManager() {
  try {
    const created = await store.createTechnicalManager({
      full_name: managerForm.full_name.trim(),
      contacts: managerForm.contacts.trim(),
    })

    form.tech_manager = created.id
    showManagerModal.value = false
    await store.initProjectsPage()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: error?.message || 'Не удалось создать менеджера',
      life: 3000 
    })
    console.error('❌ Create manager error:', error)
  }
}

function goToProject(id) {
  router.push({ name: 'project-details', params: { id } })
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return '—'
  }

  const num = Number(value)
  if (Number.isNaN(num)) return value

  return num.toFixed(2)
}

function formatDate(value) {
  if (!value || value === '—') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

function getMarginSeverity(value) {
  if (value === '—' || value === null || value === undefined) return 'info'
  const num = Number(value)
  if (Number.isNaN(num)) return 'info'
  if (num > 20) return 'success'
  if (num > 10) return 'warning'
  return 'danger'
}

function getStatusSeverity(status) {
  const map = {
    'Активный': 'success',
    'В работе': 'info',
    'Завершен': 'success',
    'Приостановлен': 'warning',
    'Отменен': 'danger'
  }
  return map[status] || 'info'
}

async function buildTableRows() {
  const sourceRows = Array.isArray(store.projectTableRows)
    ? store.projectTableRows
    : []

  financeLoading.value = true

  try {
    const rows = await Promise.all(
      sourceRows.map(async (row) => {
        try {
          const report = await financeStore.fetchProjectReport(row.id)

          return {
            ...row,
            amount: report?.planned?.revenue ?? row.amount ?? '—',
            margin_value: report?.planned?.margin ?? row.margin_value ?? '—',
            paid: report?.fact?.client_received ?? row.paid ?? '—',
          }
        } catch (error) {
          console.error(`❌ Ошибка загрузки финансов проекта ${row.id}:`, error)
          return {
            ...row,
            amount: row.amount ?? '—',
            margin_value: row.margin_value ?? '—',
            paid: row.paid ?? '—',
          }
        }
      })
    )

    tableRows.value = rows
  } finally {
    financeLoading.value = false
    financeStore.clearProjectReport()
  }
}

onMounted(async () => {
  try {
    await store.initProjectsPage()
  } catch (error) {
    console.error('❌ Ошибка загрузки проектов:', error)
  }
})

watch(
  () => store.projectTableRows,
  async () => {
    await buildTableRows()
  },
  { immediate: true }
)
</script>

<style scoped>
.projects-page {
  padding: 24px;
  background: #0E0F12;
  color: #D0D2D5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #16181C;
  border-radius: 12px;
  border: 1px solid #2A2D33;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #C9A86A;
}

.status-tiles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.status-tile-btn {
  min-width: 120px;
}

.table-wrapper {
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;
}

.link-cell {
  padding: 0 !important;
  color: #C9A86A !important;
  font-weight: 500;
}

.link-cell:hover {
  color: #D0D2D5 !important;
}

.text-positive {
  color: #4CAF50;
  font-weight: 500;
}

.field-with-action {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-with-action .action-btn {
  flex-shrink: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-weight: 500;
  font-size: 14px;
  color: #D0D2D5;
}

.req {
  color: #e74c3c;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #2A2D33;
}

.p-message-error {
  padding: 10px;
  background: rgba(201, 106, 106, 0.1);
  color: #C96A6A;
  border-radius: 8px;
  border: 1px solid rgba(201, 106, 106, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-error {
  color: #e74c3c;
  font-size: 12px;
}

/* PrimeVue overrides */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #1E2024;
  color: #C9A86A;
  border-color: #2A2D33;
  padding: 12px 16px;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #16181C;
  color: #D0D2D5;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: #2A2D33;
  padding: 10px 16px;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #1E2024;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: #1A1C20;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even):hover) {
  background: #1E2024;
}

:deep(.p-button.p-button-text.link-cell) {
  color: #C9A86A;
}

:deep(.p-button.p-button-text.link-cell:hover) {
  background: transparent;
  color: #D0D2D5;
}

:deep(.p-dialog .p-dialog-header) {
  background: #16181C;
  color: #C9A86A;
  border-color: #2A2D33;
  padding: 20px 24px;
}

:deep(.p-dialog .p-dialog-content) {
  background: #16181C;
  color: #D0D2D5;
  padding: 24px;
}

:deep(.p-dialog .p-dialog-footer) {
  background: #16181C;
  border-color: #2A2D33;
  padding: 16px 24px;
}

:deep(.p-inputtext) {
  background: #0E0F12;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-inputtext:focus) {
  border-color: #C9A86A;
  box-shadow: 0 0 0 2px rgba(201, 168, 106, 0.2);
}

:deep(.p-inputtext.p-invalid) {
  border-color: #e74c3c;
}

:deep(.p-select) {
  background: #0E0F12;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-select:not(.p-disabled):hover) {
  border-color: #C9A86A;
}

:deep(.p-select.p-invalid) {
  border-color: #e74c3c;
}

:deep(.p-select .p-select-label) {
  color: #D0D2D5;
}

:deep(.p-select-panel) {
  background: #16181C;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-select-item.p-highlight) {
  background: rgba(201, 168, 106, 0.2);
  color: #C9A86A;
}

:deep(.p-select-item:hover) {
  background: #1E2024;
}

:deep(.p-tag) {
  font-weight: 500;
}

:deep(.p-tag.p-tag-success) {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

:deep(.p-tag.p-tag-warning) {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

:deep(.p-tag.p-tag-danger) {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

:deep(.p-tag.p-tag-info) {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
}

:deep(.p-button.p-button-secondary.p-button-outlined) {
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-button.p-button-secondary.p-button-outlined:hover) {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.p-button .p-button-label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .projects-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    width: 100%;
  }

  .field-with-action {
    flex-direction: column;
  }

  .field-with-action .action-btn {
    width: 100%;
  }

  .status-tiles {
    gap: 4px;
  }

  .status-tile-btn {
    min-width: 80px;
    font-size: 12px;
  }
}
</style>