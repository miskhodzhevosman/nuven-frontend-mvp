<!-- src/views/FactoriesView.vue -->
<template>
  <div class="factories-view">
    <div class="view-header">
      <h1>Фабрики</h1>
      <Button 
        label="Добавить фабрику" 
        icon="pi pi-plus" 
        @click="openCreateDialog" 
        :disabled="store.loading"
      />
    </div>
    
    <div v-if="store.loading" class="loading-state">
      <p>Загрузка...</p>
    </div>
    
    <div v-else-if="store.sortedItems.length === 0" class="empty-state panel">
      <p class="muted">Нет фабрик. Создайте первую!</p>
    </div>
    
    <div v-else class="table-wrapper">
      <DataTable 
        :value="store.sortedItems" 
        dataKey="id"
        class="p-datatable-sm"
        stripedRows
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords}"
      >
        <Column field="id" header="ID" style="width: 80px">
          <template #body="{ data }">
            <span class="text-muted">{{ data.id }}</span>
          </template>
        </Column>
        
        <Column field="name" header="Название" style="min-width: 200px">
          <template #body="{ data }">
            <strong>{{ data.name }}</strong>
          </template>
        </Column>
        
        <Column field="address" header="Адрес" style="min-width: 200px">
          <template #body="{ data }">
            <span>{{ data.address || '—' }}</span>
          </template>
        </Column>
        
        <Column field="contacts" header="Контакты" style="min-width: 200px">
          <template #body="{ data }">
            <span>{{ data.contacts || '—' }}</span>
          </template>
        </Column>
        
        <Column header="Действия" style="width: 150px">
          <template #body="{ data }">
            <div class="actions-cell">
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-sm p-button-text" 
                @click="openEditDialog(data)"
                tooltip="Редактировать"
                tooltipOptions="{ position: 'top' }"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                @click="handleDelete(data.id)"
                tooltip="Удалить"
                tooltipOptions="{ position: 'top' }"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Диалог создания -->
    <Dialog 
      v-model:visible="showCreate" 
      header="Добавить фабрику"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <div class="form-content">
        <div class="field">
          <label for="create-name">Название <span class="req">*</span></label>
          <InputText 
            id="create-name" 
            v-model="form.name" 
            placeholder="Напр. Северный завод"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>

        <div class="field">
          <label for="create-address">Адрес</label>
          <InputText 
            id="create-address" 
            v-model="form.address" 
            placeholder="Город, улица, дом"
          />
        </div>

        <div class="field">
          <label for="create-contacts">Контакты</label>
          <Textarea 
            id="create-contacts" 
            v-model="form.contacts" 
            rows="3" 
            placeholder="Телефон, email, сайт..."
          />
        </div>

        <div v-if="submitError" class="p-message p-message-error">
          {{ submitError }}
        </div>
      </div>

      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="closeCreateDialog" class="p-button-text" />
        <Button 
          label="Создать" 
          icon="pi pi-check" 
          @click="submitCreate" 
          :loading="store.saving"
          :disabled="store.saving"
        />
      </template>
    </Dialog>

    <!-- Диалог редактирования -->
    <Dialog 
      v-model:visible="showEdit" 
      header="Редактировать фабрику"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <div class="form-content">
        <div class="field">
          <label for="edit-name">Название <span class="req">*</span></label>
          <InputText 
            id="edit-name" 
            v-model="editForm.name" 
            placeholder="Напр. Северный завод"
            :class="{ 'p-invalid': editErrors.name }"
          />
          <small v-if="editErrors.name" class="p-error">{{ editErrors.name }}</small>
        </div>

        <div class="field">
          <label for="edit-address">Адрес</label>
          <InputText 
            id="edit-address" 
            v-model="editForm.address" 
            placeholder="Город, улица, дом"
          />
        </div>

        <div class="field">
          <label for="edit-contacts">Контакты</label>
          <Textarea 
            id="edit-contacts" 
            v-model="editForm.contacts" 
            rows="3" 
            placeholder="Телефон, email, сайт..."
          />
        </div>

        <div v-if="editSubmitError" class="p-message p-message-error">
          {{ editSubmitError }}
        </div>
      </div>

      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="closeEditDialog" class="p-button-text" />
        <Button 
          label="Сохранить" 
          icon="pi pi-check" 
          @click="submitEdit" 
          :loading="store.saving"
          :disabled="store.saving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFactoriesStore } from '@/stores/factories.store';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const store = useFactoriesStore();

// UI State for Modals
const showCreate = ref(false);
const showEdit = ref(false);

// Form States
const form = ref({
  name: '',
  address: '',
  contacts: ''
});
const errors = ref({});
const submitError = ref('');

const editForm = ref({
  id: null,
  name: '',
  address: '',
  contacts: ''
});
const editErrors = ref({});
const editSubmitError = ref('');

// --- Actions ---

async function loadData() {
  await store.fetchFactories();
}

function openCreateDialog() {
  form.value = { name: '', address: '', contacts: '' };
  errors.value = {};
  submitError.value = '';
  showCreate.value = true;
}

function closeCreateDialog() {
  showCreate.value = false;
}

async function submitCreate() {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value.name = 'Название обязательно';
    return;
  }

  try {
    await store.createFactory({
      name: form.value.name.trim(),
      address: form.value.address.trim(),
      contacts: form.value.contacts.trim()
    });
    closeCreateDialog();
  } catch (error) {
    submitError.value = error.message || 'Ошибка при создании';
  }
}

function openEditDialog(factory) {
  editForm.value = {
    id: factory.id,
    name: factory.name,
    address: factory.address || '',
    contacts: factory.contacts || ''
  };
  editErrors.value = {};
  editSubmitError.value = '';
  showEdit.value = true;
}

function closeEditDialog() {
  showEdit.value = false;
}

async function submitEdit() {
  editErrors.value = {};
  if (!editForm.value.name.trim()) {
    editErrors.value.name = 'Название обязательно';
    return;
  }

  try {
    await store.updateFactory(editForm.value.id, {
      name: editForm.value.name.trim(),
      address: editForm.value.address.trim(),
      contacts: editForm.value.contacts.trim()
    });
    closeEditDialog();
  } catch (error) {
    editSubmitError.value = error.message || 'Ошибка при обновлении';
  }
}

async function handleDelete(id) {
  if (!confirm('Удалить фабрику? Это действие нельзя отменить.')) return;
  
  try {
    await store.deleteFactory(id);
  } catch (error) {
    alert(error.message || 'Ошибка при удалении');
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.factories-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #0d1117;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.view-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #e6edf3;
}

.table-wrapper {
  background: #161b22;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  border: 1px solid #30363d;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.text-muted {
  color: #8b949e;
}

.empty-state, .loading-state {
  padding: 60px;
  text-align: center;
  background: #161b22;
  border-radius: 8px;
  border: 1px solid #30363d;
}

.muted {
  color: #8b949e;
}

/* Form styles */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 500;
  font-size: 14px;
  color: #e6edf3;
}

.req {
  color: #f85149;
}

.p-invalid {
  border-color: #f85149;
}

.p-error {
  color: #f85149;
  font-size: 12px;
}

.p-message-error {
  padding: 10px;
  background: #2d1b1e;
  color: #f85149;
  border-radius: 4px;
  font-size: 14px;
}

/* --- PrimeVue Overrides for Dark Theme --- */

/* Header */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #0d1117;
  font-weight: 600;
  padding: 12px 16px;
  color: #e6edf3;
  border-color: #30363d;
}

/* Base Row Style */
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 10px 16px;
  color: #e6edf3;
  border-color: #30363d;
  background: #161b22; /* Единый фон для ячеек */
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #161b22; /* Единый фон для строки */
  transition: background-color 0.2s;
}

/* Fix for Striped Rows (Even/Odd) */
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: #161b22 !important; /* Принудительно тот же цвет */
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(odd)) {
  background: #161b22 !important;
}

/* Hover Effect - чуть светлее фона */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #1c2333 !important;
}

/* Buttons */
:deep(.p-button.p-button-text) {
  color: #8b949e;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.p-button.p-button-danger.p-button-text) {
  color: #f85149;
}

:deep(.p-button.p-button-danger.p-button-text:hover) {
  background: rgba(248, 81, 73, 0.15);
}

/* Dialogs */
:deep(.p-dialog .p-dialog-header) {
  padding: 20px 24px;
  border-bottom: 1px solid #30363d;
  background: #161b22;
  color: #e6edf3;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 24px;
  background: #161b22;
  color: #e6edf3;
}

:deep(.p-dialog .p-dialog-footer) {
  padding: 16px 24px;
  border-top: 1px solid #30363d;
  background: #161b22;
}
</style>