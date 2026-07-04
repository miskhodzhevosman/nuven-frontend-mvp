<template>
  <div class="page">

    <!-- HEADER -->
    <header class="page__header">
      <button class="btn btn--ghost" @click="goBack">
        ← Назад
      </button>

      <h1 class="title">
        {{ project?.name || 'Проект' }}
      </h1>

      <button class="btn btn--primary" @click="openEditProject">
        Редактировать проект
      </button>
    </header>

    <div v-if="loading" class="loader">
      Загрузка...
    </div>

    <div v-else-if="project" class="grid">

      <!-- ================= PROJECT INFO ================= -->
      <section class="card">
        <h2>Информация</h2>

        <div class="info-grid">
          <div><span>Статус</span> {{ project.status }}</div>
          <div><span>Клиент</span> {{ project.client }}</div>
          <div><span>Менеджер</span> {{ project.tech_manager }}</div>
          <div><span>География</span> {{ project.geography }}</div>
          <div><span>Создан</span> {{ project.created_at }}</div>
        </div>
      </section>

      <!-- ================= FINANCE ================= -->
      <section class="card">
        <h2>Финансы</h2>

        <div class="finance-grid" v-if="finance">

          <div class="kpi">
            <h3>План</h3>
            <p>Выручка: {{ planned.revenue }}</p>
            <p>COGS: {{ planned.cogs }}</p>
            <p>Маржа: {{ planned.margin }}</p>
          </div>

          <div class="kpi">
            <h3>Факт</h3>
            <p>Оплаты клиента: {{ fact.client_received }}</p>
            <p>Фабрики: {{ fact.factory_paid }}</p>
            <p>Расходы: {{ fact.project_expenses }}</p>
          </div>

          <div class="kpi">
            <h3>Cashflow</h3>
            <p>Дебиторка: {{ cashflow.accounts_receivable }}</p>
            <p>Кредиторка: {{ cashflow.accounts_payable }}</p>
          </div>

          <div class="kpi kpi--highlight">
            <h3>Чистая прибыль</h3>
            <p class="big">{{ netProfit }}</p>
          </div>

        </div>
      </section>

      <!-- ================= ITEMS ================= -->
      <section class="card full">
        <div class="card__header">
          <h2>Позиции</h2>
          <button class="btn btn--primary" @click="openCreateItem">
            + Добавить
          </button>
        </div>

        <table class="table">
          <thead>
          <tr>
            <th>Товар</th>
            <th>Кол-во</th>
            <th>Сумма</th>
            <th></th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.nomenclature }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ calcItemSum(item) }}</td>
            <td class="actions">
              <button class="btn btn--small" @click="openEditItem(item)">✏</button>
              <button class="btn btn--small btn--danger" @click="deleteItem(item.id)">🗑</button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>

    </div>

    <!-- ================= PROJECT MODAL ================= -->
    <div v-if="showProjectModal" class="modal">
      <div class="modal__card">
        <h3>Проект</h3>

        <input v-model="projectForm.name" placeholder="Название" />
        <input v-model="projectForm.geography" placeholder="География" />

        <select v-model="projectForm.client">
          <option v-for="c in clients" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>

        <select v-model="projectForm.tech_manager">
          <option v-for="m in managers" :key="m.id" :value="m.id">
            {{ m.full_name }}
          </option>
        </select>

        <div class="modal__actions">
          <button class="btn btn--primary" @click="saveProject">Сохранить</button>
          <button class="btn btn--ghost" @click="closeProjectModal">Отмена</button>
        </div>
      </div>
    </div>

    <!-- ================= ITEM MODAL ================= -->
    <div v-if="showItemModal" class="modal">
      <div class="modal__card">
        <h3>Позиция</h3>

        <select v-model="itemForm.nomenclature">
          <option v-for="n in nomenclatures" :key="n.id" :value="n.id">
            {{ n.name }}
          </option>
        </select>

        <input v-model="itemForm.quantity" placeholder="Количество" />
        <input v-model="itemForm.fixed_cost_price" placeholder="Себестоимость" />
        <input v-model="itemForm.fixed_sale_price" placeholder="Цена продажи" />

        <div class="modal__actions">
          <button class="btn btn--primary" @click="saveItem">Сохранить</button>
          <button class="btn btn--ghost" @click="closeItemModal">Отмена</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'

const store = useProjectsStore()
const route = useRoute()
const router = useRouter()

const projectId = Number(route.params.id)

const loading = ref(false)

const project = computed(() => store.currentProject)
const finance = computed(() => store.currentProjectFinance)
const items = computed(() => store.currentProjectItems)

const planned = computed(() => finance.value?.planned || {})
const fact = computed(() => finance.value?.fact || {})
const cashflow = computed(() => finance.value?.cashflow || {})
const netProfit = computed(() => finance.value?.net_profit ?? 0)

const clients = computed(() => store.clients)
const managers = computed(() => store.managers)
const nomenclatures = computed(() => store.nomenclatures)

/* ===================== */
/* LOAD */
/* ===================== */
onMounted(async () => {
  loading.value = true
  await store.initProjectDetails(projectId)
  loading.value = false
})

function goBack() {
  router.push('/projects')
}

/* ===================== */
/* PROJECT EDIT */
/* ===================== */
const showProjectModal = ref(false)

const projectForm = reactive({
  name: '',
  geography: '',
  client: '',
  tech_manager: '',
  status: '',
})

function openEditProject() {
  Object.assign(projectForm, store.currentProject)
  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
}

async function saveProject() {
  await store.updateProject(projectId, {
    name: projectForm.name,
    geography: projectForm.geography,
    client: Number(projectForm.client),
    tech_manager: Number(projectForm.tech_manager),
    status: Number(projectForm.status),
  })

  closeProjectModal()
}

/* ===================== */
/* ITEMS */
/* ===================== */
const showItemModal = ref(false)
const editingItemId = ref(null)

const itemForm = reactive({
  nomenclature: '',
  quantity: '',
  fixed_cost_price: '',
  fixed_sale_price: '',
  project: projectId,
})

function openCreateItem() {
  editingItemId.value = null
  Object.assign(itemForm, {
    nomenclature: '',
    quantity: '',
    fixed_cost_price: '',
    fixed_sale_price: '',
    project: projectId,
  })
  showItemModal.value = true
}

function openEditItem(item) {
  editingItemId.value = item.id

  Object.assign(itemForm, {
    nomenclature: item.nomenclature,
    quantity: item.quantity,
    fixed_cost_price: item.fixed_cost_price,
    fixed_sale_price: item.fixed_sale_price,
    project: projectId,
  })

  showItemModal.value = true
}

function closeItemModal() {
  showItemModal.value = false
}

async function saveItem() {
  const payload = {
    nomenclature: Number(itemForm.nomenclature),
    quantity: itemForm.quantity,
    fixed_cost_price: itemForm.fixed_cost_price,
    fixed_sale_price: itemForm.fixed_sale_price,
    project: projectId,
  }

  if (editingItemId.value) {
    await store.updateProjectItem(editingItemId.value, payload)
  } else {
    await store.createProjectItem(payload)
  }

  closeItemModal()
}

async function deleteItem(id) {
  await store.deleteProjectItem(id)
}

function calcItemSum(item) {
  return Number(item.quantity || 0) * Number(item.fixed_sale_price || 0)
}
</script>

<style scoped>
/* ===== BASE ===== */
div {
  color: #e5e7eb;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

h1 {
  font-size: 22px;
  margin-bottom: 16px;
}

h2 {
  font-size: 18px;
  margin: 16px 0 10px;
  color: #f3f4f6;
}

h3 {
  font-size: 14px;
  margin: 12px 0 8px;
  color: #9ca3af;
}

/* ===== BUTTONS ===== */
button {
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.15s;
  margin-right: 6px;
}

button:hover {
  background: #374151;
}

button:active {
  transform: scale(0.98);
}

/* ===== SECTIONS ===== */
section {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}

/* ===== TEXT BLOCKS ===== */
section div {
  margin-bottom: 6px;
  font-size: 14px;
  color: #d1d5db;
}

/* ===== TABLE ===== */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #0b1220;
  border-radius: 10px;
  overflow: hidden;
}

th {
  text-align: left;
  font-size: 12px;
  color: #9ca3af;
  padding: 10px;
  border-bottom: 1px solid #1f2937;
}

td {
  padding: 10px;
  border-bottom: 1px solid #1f2937;
  font-size: 13px;
  color: #e5e7eb;
}

tr:hover td {
  background: #111827;
}

/* ===== MODALS ===== */
div[v-if] {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* inner modal card */
div[v-if] > div {
  width: 420px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
}

/* ===== FORMS ===== */
input,
select {
  width: 100%;
  padding: 8px 10px;
  margin: 6px 0;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #0b1220;
  color: #e5e7eb;
  outline: none;
}

input:focus,
select:focus {
  border-color: #3b82f6;
}

/* ===== LAYOUT HELPERS ===== */
section > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

/* fix modal inner spacing override */
div[v-if] section > div {
  display: block;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  section > div {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>