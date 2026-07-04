<template>
  <div class="project-details-page">
    <div class="page-header">
      <div>
        <button class="back-btn" @click="goBack">← Назад к проектам</button>
        <h1>{{ projectInfo?.name || 'Проект' }}</h1>
      </div>
    </div>

    <div v-if="store.detailsLoading" class="loading-state">
      Загрузка проекта...
    </div>

    <template v-else-if="projectInfo">
      <!-- Информация о проекте -->
      <section class="card">
        <h2>Информация о проекте</h2>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Статус</span>
            <span class="value">{{ projectInfo.status_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Клиент</span>
            <span class="value">{{ projectInfo.client_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Менеджер</span>
            <span class="value">{{ projectInfo.manager_name || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">География</span>
            <span class="value">{{ projectInfo.geography || '—' }}</span>
          </div>

          <div class="info-item">
            <span class="label">Создан</span>
            <span class="value">{{ formatDate(projectInfo.created_at) }}</span>
          </div>
        </div>
      </section>

      <!-- Экономика проекта -->
      <section class="card">
        <h2>Экономика проекта</h2>

        <table class="economy-table">
          <tbody>
            <tr>
              <td>Выручка</td>
              <td>{{ formatMoney(finance?.revenue) }}</td>
            </tr>
            <tr>
              <td>Себестоимость</td>
              <td>{{ formatMoney(finance?.cost_price) }}</td>
            </tr>
            <tr>
              <td>Валовая прибыль</td>
              <td>{{ formatMoney(finance?.gross_profit) }}</td>
            </tr>
            <tr>
              <td>Маржа</td>
              <td>{{ finance?.margin ?? '—' }}{{ finance?.margin !== undefined ? '%' : '' }}</td>
            </tr>
            <tr>
              <td>Получено от клиента</td>
              <td>{{ formatMoney(finance?.received_from_client) }}</td>
            </tr>
            <tr>
              <td>Дебиторика</td>
              <td>{{ formatMoney(finance?.accounts_receivable) }}</td>
            </tr>
            <tr>
              <td>Оплачено фабрикам</td>
              <td>{{ formatMoney(finance?.paid_to_factories) }}</td>
            </tr>
            <tr>
              <td>Кредиторика</td>
              <td>{{ formatMoney(finance?.accounts_payable) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Доступ к проекту -->
      <section class="card">
        <h2>Доступ к проекту</h2>
        <div class="access-row">
          {{ projectInfo.manager_name || '—' }}
        </div>
      </section>

      <!-- Позиции -->
      <section class="card">
        <h2>Позиции</h2>

        <Table
          :columns="itemsColumns"
          :rows="store.currentProjectItemsRows"
          :loading="store.detailsLoading"
          row-key="id"
        >
          <template #cell-nomenclature_name="{ value }">
            {{ value || '—' }}
          </template>

          <template #cell-quantity="{ value }">
            {{ value || '—' }}
          </template>

          <template #cell-total_amount="{ value }">
            {{ formatMoney(value) }}
          </template>
        </Table>
      </section>
    </template>

    <div v-else class="empty-state">
      Проект не найден
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Table from '@/components/Table.vue'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = computed(() => Number(route.params.id))
const projectInfo = computed(() => store.currentProjectInfo)
const finance = computed(() => store.currentProjectFinance)

const itemsColumns = [
  { key: 'nomenclature_name', label: 'Товар' },
  { key: 'quantity', label: 'Кол-во' },
  { key: 'total_amount', label: 'Сумма' },
]

function goBack() {
  router.push({ name: 'projects' })
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

onMounted(async () => {
  try {
    await store.initProjectDetails(projectId.value)
  } catch (error) {
    console.error('Ошибка загрузки проекта', error)
  }
})

onUnmounted(() => {
  store.clearCurrentProject()
})
</script>

<style scoped>
.project-details-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 8px 0 0;
  font-size: 28px;
}

.back-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font: inherit;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
}

.card h2 {
  margin: 0 0 16px;
  font-size: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #6b7280;
  font-size: 13px;
}

.value {
  font-size: 15px;
  font-weight: 500;
}

.economy-table {
  width: 100%;
  border-collapse: collapse;
}

.economy-table td {
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.economy-table td:last-child {
  text-align: right;
  font-weight: 600;
}

.access-row {
  font-size: 15px;
  font-weight: 500;
}

.loading-state,
.empty-state {
  padding: 20px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  background: #fff;
}

@media (max-width: 900px) {
  .project-details-page {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>