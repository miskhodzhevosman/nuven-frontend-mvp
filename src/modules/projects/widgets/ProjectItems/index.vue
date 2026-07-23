<!-- modules/app/widgets/ProjectItems/index.vue -->
<template>
  <section class="card">
    <div class="card-header">
      <h2>Позиции проекта</h2>
      <button 
        id="add-item-btn"
        class="btn btn-primary" 
        @click="openCreateItem"
      >+ Добавить позицию</button>
    </div>

    <div v-if="!items.length" class="state muted">Нет позиций.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Товар</th>
            <th class="num">Кол-во</th>
            <th class="num">Себест.</th>
            <th class="num">Продажа</th>
            <th>Фабрика</th>
            <th class="actions">Операции</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ nomenclatureName(item.nomenclature) }}</td>
            <td class="num">{{ item.quantity }}</td>
            <td class="num">{{ formatAmount(item.fixed_cost_price) }}</td>
            <td class="num">{{ formatAmount(item.fixed_sale_price) }}</td>
            <td>{{ factoryName(getFactoryId(item)) }}</td>
            <td class="actions">
              <button class="btn btn-ghost" @click="openEditItem(item)">Редактировать</button>
              <button class="btn btn-danger" @click="confirmDeleteId = item.id">Удалить</button>
              <button 
                id="pay-factory-btn"
                class="btn btn-pay" 
                @click="emit('payFactory', item)"
              >Оплатить</button>
              <span v-if="confirmDeleteId === item.id" class="confirm">
                Точно?
                <button class="btn btn-danger" @click="deleteItem(item.id)">Да</button>
                <button class="btn btn-ghost" @click="confirmDeleteId = null">Нет</button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка: Создание/редактирование позиции -->
    <ItemFormModal
      v-model="showModal"
      :editing-id="editingId"
      :project-id="projectId"
      @created="handleCreated"
      @updated="handleUpdated"
    />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '../../store'
import { storeToRefs } from 'pinia'
import ItemFormModal from './components/ItemFormModal.vue'

const props = defineProps({
  projectId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['refresh', 'payFactory'])

const store = useProjectsStore()
const { projectItems, nomenclatures, factories } = storeToRefs(store)

// State
const showModal = ref(false)
const editingId = ref(null)
const confirmDeleteId = ref(null)

// Computed
const items = computed(() => projectItems.value || [])

// Methods
function nomenclatureName(id) {
  const n = nomenclatures.value?.find(n => n.id === id)
  return n?.name || '—'
}

function factoryName(id) {
  const f = factories.value?.find(f => f.id === id)
  return f?.name || '—'
}

function getFactoryId(item) {
  const n = nomenclatures.value?.find(n => n.id === item.nomenclature)
  return n?.factory ?? null
}

function formatAmount(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : String(v)
}

function openCreateItem() {
  editingId.value = null
  showModal.value = true
}

function openEditItem(item) {
  editingId.value = item.id
  showModal.value = true
}

async function deleteItem(id) {
  try {
    await store.deleteProjectItem(id)
    await emit('refresh')
  } finally {
    confirmDeleteId.value = null
  }
}

function handleCreated() {
  emit('refresh')
}

function handleUpdated() {
  emit('refresh')
}
</script>

<style scoped>
/* ============================================
   ТЕМНЫЕ СТИЛИ ДЛЯ ProjectItems
   ============================================ */

.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

.state {
  padding: 24px;
  text-align: center;
  color: rgba(208, 210, 213, 0.5);
}

.state.muted {
  color: rgba(208, 210, 213, 0.4);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(208, 210, 213, 0.08);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #D0D2D5;
  min-width: 600px;
}

.table th,
.table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(208, 210, 213, 0.06);
  white-space: nowrap;
}

.table th {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 600;
  color: rgba(208, 210, 213, 0.7);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.confirm {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 13px;
  color: rgba(208, 210, 213, 0.6);
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #C9A86A;
  color: #16181C;
}

.btn-primary:hover:not(:disabled) {
  background: #d4b87a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 106, 0.3);
}

.btn-ghost {
  background: transparent;
  color: #D0D2D5;
  border-color: rgba(208, 210, 213, 0.2);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 210, 213, 0.3);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-pay {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.15);
}

.btn-pay:hover {
  background: rgba(74, 222, 128, 0.2);
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 640px) {
  .card {
    padding: 14px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .card-header .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .table {
    font-size: 12px;
    min-width: 500px;
  }

  .table th,
  .table td {
    padding: 6px 10px;
    font-size: 12px;
  }

  .table th {
    font-size: 10px;
  }

  .actions {
    gap: 4px;
  }

  .actions .btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .table {
    min-width: 400px;
  }

  .table th,
  .table td {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>