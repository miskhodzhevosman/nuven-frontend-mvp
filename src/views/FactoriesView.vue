<!-- src/views/FactoriesView.vue -->
<template>
  <div class="factories-view">
    <div class="view-header">
      <h1>Фабрики</h1>
      <button class="primary" @click="openCreateDialog" :disabled="store.loading">+ Добавить фабрику</button>
    </div>
    
    <div v-if="store.loading" class="loading-state">
      <p>Загрузка...</p>
    </div>
    
    <div v-else-if="store.sortedItems.length === 0" class="empty-state panel">
      <p class="muted">Нет фабрик. Создайте первую!</p>
    </div>
    
    <div v-else class="factories-grid">
      <div v-for="factory in store.sortedItems" :key="factory.id" class="factory-card panel">
        <div class="factory-header">
          <h3>{{ factory.name }}</h3>
          <div class="factory-actions">
            <button @click="openEditDialog(factory)">✏️</button>
            <button class="danger" @click="handleDelete(factory.id)">🗑️</button>
          </div>
        </div>
        
        <!-- Адрес -->
        <p class="muted" v-if="factory.address">
          📍 {{ factory.address }}
        </p>
        
        <!-- Контакты -->
        <p class="muted" v-if="factory.contacts">
          📞 {{ factory.contacts }}
        </p>

        <div class="factory-meta">
          <span>🆔 ID: {{ factory.id }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Модалка создания -->
  <div v-if="showCreate" class="modal-backdrop" @click.self="closeCreateDialog">
    <div class="modal panel">
      <div class="modal-header">
        <h3>Добавить фабрику</h3>
        <button class="icon-btn" @click="closeCreateDialog" aria-label="Закрыть">✖</button>
      </div>

      <form class="col" @submit.prevent="submitCreate">
        <div class="form-row">
          <label>Название <span class="req">*</span></label>
          <input
            v-model.trim="form.name"
            type="text"
            placeholder="Напр. Северный завод"
            :class="{ 'has-error': errors.name }"
            required
          />
          <small v-if="errors.name" class="err">{{ errors.name }}</small>
        </div>

        <div class="form-row">
          <label>Адрес</label>
          <input
            v-model.trim="form.address"
            type="text"
            placeholder="Город, улица, дом"
          />
        </div>

        <div class="form-row">
          <label>Контакты</label>
          <textarea
            v-model.trim="form.contacts"
            rows="3"
            placeholder="Телефон, email, сайт..."
          />
        </div>

        <div v-if="submitError" class="alert-danger">
          {{ submitError }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeCreateDialog">Отмена</button>
          <button class="primary" type="submit" :disabled="store.saving">
            {{ store.saving ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Модалка редактирования -->
  <div v-if="showEdit" class="modal-backdrop" @click.self="closeEditDialog">
    <div class="modal panel">
      <div class="modal-header">
        <h3>Редактировать фабрику</h3>
        <button class="icon-btn" @click="closeEditDialog" aria-label="Закрыть">✖</button>
      </div>

      <form class="col" @submit.prevent="submitEdit">
        <div class="form-row">
          <label>Название <span class="req">*</span></label>
          <input
            v-model.trim="editForm.name"
            type="text"
            placeholder="Напр. Северный завод"
            :class="{ 'has-error': editErrors.name }"
            required
          />
          <small v-if="editErrors.name" class="err">{{ editErrors.name }}</small>
        </div>

        <div class="form-row">
          <label>Адрес</label>
          <input
            v-model.trim="editForm.address"
            type="text"
            placeholder="Город, улица, дом"
          />
        </div>

        <div class="form-row">
          <label>Контакты</label>
          <textarea
            v-model.trim="editForm.contacts"
            rows="3"
            placeholder="Телефон, email, сайт..."
          />
        </div>

        <div v-if="editSubmitError" class="alert-danger">
          {{ editSubmitError }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeEditDialog">Отмена</button>
          <button class="primary" type="submit" :disabled="store.saving">
            {{ store.saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFactoriesStore } from '@/stores/factories.store'; // Импортируем стор

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
  max-width: 1200px;
  margin: 0 auto;
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
}

.factories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.factory-card {
  padding: 20px;
  transition: all 0.2s ease;
}

.factory-card:hover {
  border-color: #2a3040;
  transform: translateY(-2px);
}

.factory-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
}

.factory-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.factory-actions {
  display: flex;
  gap: 8px;
}

.factory-actions button {
  padding: 6px 10px;
  font-size: 14px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
}

.factory-actions button:hover {
  border-color: var(--border);
}

.factory-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 14px;
  color: var(--muted);
}

.empty-state, .loading-state {
  padding: 60px;
  text-align: center;
}

.loading-state p {
  color: var(--muted);
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.icon-btn:hover {
  background: var(--hover);
  border-radius: 4px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row label {
  font-weight: 500;
  font-size: 14px;
}

.req {
  color: #e74c3c;
}

.form-row input,
.form-row textarea {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-row input:focus,
.form-row textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.has-error {
  border-color: #e74c3c !important;
}

.err {
  color: #e74c3c;
  font-size: 12px;
}

.alert-danger {
  padding: 10px;
  background: #fee;
  color: #c0392b;
  border-radius: 4px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.modal-actions button {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.modal-actions button:hover {
  background: var(--hover);
}

.modal-actions button.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.modal-actions button.primary:hover {
  background: var(--primary-dark);
}

.modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.danger {
  color: #e74c3c;
}

.danger:hover {
  background: #fee !important;
}
</style>