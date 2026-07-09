<!-- src/views/FactoriesView.vue -->
<template>
  <div class="factories-view">
    <div class="view-header">
      <h1>Заводы</h1>
      <button class="primary" @click="openCreateDialog">+ Добавить завод</button>
    </div>
    
    <div v-if="loading" class="loading-state">
      <p>Загрузка...</p>
    </div>
    
    <div v-else-if="factories.length === 0" class="empty-state panel">
      <p class="muted">Нет заводов. Создайте первый!</p>
    </div>
    
    <div v-else class="factories-grid">
      <div v-for="factory in factories" :key="factory.id" class="factory-card panel">
        <div class="factory-header">
          <h3>{{ factory.name }}</h3>
          <div class="factory-actions">
            <button @click="openEditDialog(factory)">✏️</button>
            <button class="danger" @click="deleteFactory(factory.id)">🗑️</button>
          </div>
        </div>
        <p class="muted">{{ factory.description || 'Нет описания' }}</p>
        <div class="factory-meta">
          <span>📍 {{ factory.location || 'Не указано' }}</span>
          <span>📅 {{ formatDate(factory.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Модалка создания -->
  <div v-if="showCreate" class="modal-backdrop" @click.self="closeCreateDialog">
    <div class="modal panel">
      <div class="modal-header">
        <h3>Добавить завод</h3>
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
          <label>Локация</label>
          <input
            v-model.trim="form.location"
            type="text"
            placeholder="Город / адрес"
          />
        </div>

        <div class="form-row">
          <label>Описание</label>
          <textarea
            v-model.trim="form.description"
            rows="3"
            placeholder="Краткое описание завода"
          />
        </div>

        <div v-if="submitError" class="alert-danger">
          {{ submitError }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeCreateDialog">Отмена</button>
          <button class="primary" type="submit" :disabled="submitting">
            {{ submitting ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Модалка редактирования -->
  <div v-if="showEdit" class="modal-backdrop" @click.self="closeEditDialog">
    <div class="modal panel">
      <div class="modal-header">
        <h3>Редактировать завод</h3>
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
          <label>Локация</label>
          <input
            v-model.trim="editForm.location"
            type="text"
            placeholder="Город / адрес"
          />
        </div>

        <div class="form-row">
          <label>Описание</label>
          <textarea
            v-model.trim="editForm.description"
            rows="3"
            placeholder="Краткое описание завода"
          />
        </div>

        <div v-if="editSubmitError" class="alert-danger">
          {{ editSubmitError }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeEditDialog">Отмена</button>
          <button class="primary" type="submit" :disabled="editSubmitting">
            {{ editSubmitting ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFactories, createFactory, updateFactory, deleteFactory as deleteFactoryApi } from '@/api/factories';

const factories = ref([]);
const loading = ref(false);

// Create state
const showCreate = ref(false);
const submitting = ref(false);
const submitError = ref('');
const form = ref({
  name: '',
  location: '',
  description: ''
});
const errors = ref({});

// Edit state
const showEdit = ref(false);
const editSubmitting = ref(false);
const editSubmitError = ref('');
const editForm = ref({
  id: null,
  name: '',
  location: '',
  description: ''
});
const editErrors = ref({});

async function loadFactories() {
  loading.value = true;
  try {
    const data = await getFactories();
    // Ensure we always have an array
    if (Array.isArray(data)) {
      factories.value = data;
    } else if (data && typeof data === 'object') {
      // If response is an object with items property
      factories.value = data.items || data.results || [];
    } else {
      factories.value = [];
    }
  } catch (error) {
    console.error('Failed to load factories:', error);
    factories.value = [];
  } finally {
    loading.value = false;
  }
}

async function deleteFactory(id) {
  if (!confirm('Удалить завод?')) return;
  try {
    await deleteFactoryApi(id);
    factories.value = factories.value.filter(f => f.id !== id);
  } catch (error) {
    console.error('Failed to delete factory:', error);
    alert('Ошибка при удалении завода');
  }
}

function openCreateDialog() {
  form.value = {
    name: '',
    location: '',
    description: ''
  };
  errors.value = {};
  submitError.value = '';
  showCreate.value = true;
}

function closeCreateDialog() {
  showCreate.value = false;
  submitting.value = false;
  submitError.value = '';
}

async function submitCreate() {
  // Валидация
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value.name = 'Название обязательно';
    return;
  }

  submitting.value = true;
  submitError.value = '';

  try {
    const newFactory = await createFactory({
      name: form.value.name.trim(),
      location: form.value.location.trim() || null,
      description: form.value.description.trim() || null
    });
    
    // Ensure factories.value is an array before pushing
    if (!Array.isArray(factories.value)) {
      factories.value = [];
    }
    factories.value.push(newFactory);
    closeCreateDialog();
  } catch (error) {
    console.error('Failed to create factory:', error);
    submitError.value = error.message || 'Ошибка при создании завода';
  } finally {
    submitting.value = false;
  }
}

function openEditDialog(factory) {
  editForm.value = {
    id: factory.id,
    name: factory.name,
    location: factory.location || '',
    description: factory.description || ''
  };
  editErrors.value = {};
  editSubmitError.value = '';
  showEdit.value = true;
}

function closeEditDialog() {
  showEdit.value = false;
  editSubmitting.value = false;
  editSubmitError.value = '';
}

async function submitEdit() {
  // Валидация
  editErrors.value = {};
  if (!editForm.value.name.trim()) {
    editErrors.value.name = 'Название обязательно';
    return;
  }

  editSubmitting.value = true;
  editSubmitError.value = '';

  try {
    const updatedFactory = await updateFactory(editForm.value.id, {
      name: editForm.value.name.trim(),
      location: editForm.value.location.trim() || null,
      description: editForm.value.description.trim() || null
    });
    
    // Ensure factories.value is an array before finding index
    if (!Array.isArray(factories.value)) {
      factories.value = [];
    }
    const index = factories.value.findIndex(f => f.id === editForm.value.id);
    if (index !== -1) {
      factories.value[index] = updatedFactory;
    }
    
    closeEditDialog();
  } catch (error) {
    console.error('Failed to update factory:', error);
    editSubmitError.value = error.message || 'Ошибка при обновлении завода';
  } finally {
    editSubmitting.value = false;
  }
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU');
}

onMounted(() => {
  loadFactories();
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