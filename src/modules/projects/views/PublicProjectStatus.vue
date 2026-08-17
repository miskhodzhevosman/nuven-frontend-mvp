<template>
  <div class="public-status-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка статуса заказа...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="retry" class="btn btn-primary">Попробовать снова</button>
    </div>

    <div v-else-if="project" class="status-card">
      <!-- Шапка -->
      <div class="status-header">
        <div class="header-left">
          <div class="project-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h1>{{ project.name }}</h1>
            <p class="client">{{ project.client || 'Клиент не указан' }}</p>
          </div>
        </div>
        <span class="hashid">#{{ project.hashid }}</span>
      </div>

      <!-- Вкладки -->
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'progress' }"
          @click="activeTab = 'progress'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Прогресс
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Корзина
          <span class="badge" v-if="items.length">{{ items.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'payments' }"
          @click="activeTab = 'payments'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M4 4v16h16"/>
            <polyline points="20 6 12 14 8 10 4 14"/>
          </svg>
          Оплаты
          <span class="badge" v-if="payments.length">{{ payments.length }}</span>
        </button>
      </div>

      <!-- Контент вкладок -->
      <div class="tab-content">
        <!-- Вкладка: Прогресс -->
        <div v-if="activeTab === 'progress'" class="progress-section">
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-label">Текущий статус</span>
              <span class="status-badge" :style="{ backgroundColor: getStatusColor(project.status?.order) }">
                {{ project.status?.name || 'Неизвестно' }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Прогресс</span>
              <span class="progress-text">{{ progressPercentage }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Обновлен</span>
              <span>{{ formatDateReadable(project.updated_at) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Создан</span>
              <span>{{ formatDateReadable(project.created_at) }}</span>
            </div>
          </div>

          <!-- Вертикальная дорожка статусов -->
          <div class="status-timeline">
            <div class="timeline-line">
              <div 
                class="timeline-fill" 
                :style="{ height: progressPercentage + '%' }"
              ></div>
            </div>
            
            <div 
              v-for="(status, index) in allStatuses" 
              :key="status.id"
              class="timeline-item"
              :class="{
                completed: index <= currentStatusIndex,
                active: index === currentStatusIndex,
                pending: index > currentStatusIndex
              }"
            >
              <div class="timeline-dot">
                <span v-if="index < currentStatusIndex" class="checkmark">✓</span>
                <span v-else-if="index === currentStatusIndex" class="dot-number">{{ index + 1 }}</span>
                <span v-else class="dot-number">{{ index + 1 }}</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-step">Шаг {{ index + 1 }}</span>
                  <span class="timeline-status-name">{{ status.name }}</span>
                </div>
                <div class="timeline-status-indicator">
                  <span v-if="index < currentStatusIndex" class="status-done">✓ Завершено</span>
                  <span v-else-if="index === currentStatusIndex" class="status-current">● В процессе</span>
                  <span v-else class="status-pending">○ Ожидает</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Вкладка: Корзина -->
        <div v-if="activeTab === 'items'" class="items-section">
          <div class="items-header">
            <h3>Позиции заказа</h3>
            <span class="items-count">Всего: {{ items.length }} позиций</span>
          </div>

          <div v-if="itemsLoading" class="items-loading">
            <div class="spinner-small"></div>
            <p>Загрузка позиций...</p>
          </div>

          <div v-else-if="itemsError" class="items-error">
            <p>{{ itemsError }}</p>
            <button @click="fetchItems" class="btn-sm btn-primary">Повторить</button>
          </div>

          <div v-else-if="items.length === 0" class="empty-items">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <p>В заказе пока нет позиций</p>
          </div>

          <div v-else>
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Техническое наименование</th>
                    <th class="text-right">Количество</th>
                    <th class="text-right">Цена</th>
                    <th class="text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in items" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td class="item-name">{{ item.technical_name || 'Не указано' }}</td>
                    <td class="text-right">{{ formatNumber(item.quantity) }}</td>
                    <td class="text-right">{{ formatCurrency(item.sale_price) }}</td>
                    <td class="text-right">{{ formatCurrency(calculateTotal(item)) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right"><strong>Итого:</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalSum) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Дебиторка -->
            <div class="debt-section" :class="{ 'has-debt': accountsReceivable > 0, 'no-debt': accountsReceivable <= 0 }">
              <div class="debt-info">
                <span class="debt-label">Дебиторская задолженность</span>
                <span class="debt-amount">{{ formatCurrency(accountsReceivable) }}</span>
              </div>
              <div class="debt-status">
                <span v-if="accountsReceivable > 0" class="debt-badge debt-negative">
                  <span class="debt-icon">⚠️</span>
                  Есть задолженность
                </span>
                <span v-else class="debt-badge debt-positive">
                  <span class="debt-icon">✅</span>
                  Задолженности нет
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Вкладка: Оплаты -->
        <div v-if="activeTab === 'payments'" class="payments-section">
          <div class="payments-header">
            <h3>Оплаты клиента</h3>
            <div class="payments-summary">
              <span class="payments-total">
                Получено: <strong>{{ formatCurrency(paymentsTotal) }}</strong>
              </span>
              <span class="payments-debt" :class="{ 'debt-positive': accountsReceivable <= 0, 'debt-negative': accountsReceivable > 0 }">
                Долг: <strong>{{ formatCurrency(accountsReceivable) }}</strong>
              </span>
            </div>
          </div>

          <div v-if="paymentsLoading" class="payments-loading">
            <div class="spinner-small"></div>
            <p>Загрузка платежей...</p>
          </div>

          <div v-else-if="paymentsError" class="payments-error">
            <p>{{ paymentsError }}</p>
            <button @click="fetchPayments" class="btn-sm btn-primary">Повторить</button>
          </div>

          <div v-else-if="payments.length === 0" class="empty-payments">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10"/>
              <path d="M4 4v16h16"/>
              <polyline points="20 6 12 14 8 10 4 14"/>
            </svg>
            <p>Платежей пока нет</p>
          </div>

          <div v-else class="payments-list">
            <div 
              v-for="(payment, index) in payments" 
              :key="payment.id || index"
              class="payment-item"
            >
              <div class="payment-left">
                <div class="payment-number">#{{ index + 1 }}</div>
                <div class="payment-info">
                  <div class="payment-date">{{ formatDateReadable(payment.date) }}</div>
                  <div 
                    class="payment-comment" 
                    :class="{ 'no-comment': !payment.comment }"
                  >
                    {{ payment.comment || 'Без комментария' }}
                  </div>
                </div>
              </div>
              <div class="payment-amount positive">
                +{{ formatCurrency(payment.amount) }}
              </div>
            </div>

            <!-- Итог по платежам -->
            <div class="payments-footer">
              <div class="payment-total-item">
                <span class="payment-total-label">Всего получено:</span>
                <span class="payment-total-amount positive">{{ formatCurrency(paymentsTotal) }}</span>
              </div>
              <div class="payment-total-item">
                <span class="payment-total-label">Остаток долга:</span>
                <span class="payment-total-amount" :class="{ 'debt-negative': accountsReceivable > 0, 'debt-positive': accountsReceivable <= 0 }">
                  {{ formatCurrency(accountsReceivable) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия -->
      <div class="status-footer">
        <div class="footer-left">
          <span class="live-dot"></span>
          <p class="note">Статус обновляется автоматически</p>
        </div>
        <button @click="refresh" class="btn-refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/>
          </svg>
          Обновить
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const project = ref(null)
const allStatuses = ref([])
const items = ref([])
const itemsLoading = ref(false)
const itemsError = ref(null)
const payments = ref([])
const paymentsLoading = ref(false)
const paymentsError = ref(null)
const accountsReceivable = ref(0)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('progress')
let refreshInterval = null

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.nuven.space'

const currentStatusIndex = computed(() => {
  if (!project.value?.status || !allStatuses.value.length) return 0
  return allStatuses.value.findIndex(s => s.id === project.value.status.id)
})

const progressPercentage = computed(() => {
  if (!allStatuses.value.length) return 0
  const total = allStatuses.value.length - 1
  if (total === 0) return 100
  return Math.round((currentStatusIndex.value / total) * 100)
})

const totalSum = computed(() => {
  return items.value.reduce((sum, item) => {
    const price = parseFloat(item.sale_price) || 0
    const quantity = parseFloat(item.quantity) || 0
    return sum + (price * quantity)
  }, 0)
})

const paymentsTotal = computed(() => {
  return payments.value.reduce((sum, payment) => {
    return sum + (parseFloat(payment.amount) || 0)
  }, 0)
})

const fetchAllStatuses = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/project-statuses/public/`
    )
    allStatuses.value = response.data || []
    allStatuses.value.sort((a, b) => a.order - b.order)
  } catch (err) {
    console.error('Error fetching statuses:', err)
  }
}

const fetchProjectStatus = async (hashid) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/projects/public/${hashid}/status/`
    )
    project.value = response.data
    await fetchAllStatuses()
    // Загружаем позиции и платежи
    await Promise.all([
      fetchItems(),
      fetchPayments()
    ])
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Заказ не найден. Проверьте правильность ссылки.'
    } else {
      error.value = 'Ошибка загрузки статуса. Попробуйте позже.'
    }
    console.error('Error fetching project status:', err)
  } finally {
    loading.value = false
  }
}

const fetchItems = async () => {
  const hashid = route.params.hashid
  if (!hashid) return
  
  itemsLoading.value = true
  itemsError.value = null
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/crm/projects/public/${hashid}/items/`
    )
    items.value = response.data.items || []
  } catch (err) {
    itemsError.value = 'Ошибка загрузки позиций заказа'
    console.error('Error fetching items:', err)
    items.value = []
  } finally {
    itemsLoading.value = false
  }
}

const fetchPayments = async () => {
  const hashid = route.params.hashid
  if (!hashid) return
  
  paymentsLoading.value = true
  paymentsError.value = null
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/finance/projects/public/${hashid}/payments/`
    )
    payments.value = response.data.client_payments || []
    accountsReceivable.value = parseFloat(response.data.accounts_receivable) || 0
  } catch (err) {
    paymentsError.value = 'Ошибка загрузки платежей'
    console.error('Error fetching payments:', err)
    payments.value = []
    accountsReceivable.value = 0
  } finally {
    paymentsLoading.value = false
  }
}

const getStatusColor = (order) => {
  const colors = {
    1: '#C4965A',
    2: '#D4A86A',
    3: '#E8B86D',
    4: '#C87A3A',
    5: '#A0522D',
    6: '#8B6B4D',
    7: '#6B8E6B',
    8: '#4A7A8B',
    9: '#7A6B8B',
    10: '#8B6B6B',
    11: '#6B8B6B',
    12: '#2E7D32',
  }
  return colors[order] || '#9CA3AF'
}

const formatDateReadable = (dateString) => {
  if (!dateString) return '—'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}

const formatNumber = (value) => {
  if (!value) return '0'
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  return num.toLocaleString('ru-RU', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })
}

const formatCurrency = (value) => {
  if (!value) return '0 '
  const num = parseFloat(value)
  if (isNaN(num)) return '0 '
  return num.toLocaleString('ru-RU', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  }) + ' '
}

const calculateTotal = (item) => {
  const price = parseFloat(item.sale_price) || 0
  const quantity = parseFloat(item.quantity) || 0
  return price * quantity
}

const refresh = () => {
  const hashid = route.params.hashid
  if (hashid) {
    fetchProjectStatus(hashid)
  }
}

const retry = refresh

onMounted(() => {
  const hashid = route.params.hashid
  if (hashid) {
    fetchProjectStatus(hashid)
    // refreshInterval = setInterval(() => {
    //   fetchProjectStatus(hashid)
    // }, 30000)
  } else {
    error.value = 'Не указан идентификатор заказа'
    loading.value = false
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

watch(
  () => route.params.hashid,
  (newHashid) => {
    if (newHashid) {
      fetchProjectStatus(newHashid)
    }
  }
)
</script>

<style scoped>
/* Общие стили */
.public-status-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.status-card {
  max-width: 820px;
  width: 100%;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Шапка */
.status-header {
  padding: 30px 32px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.project-icon {
  width: 48px;
  height: 48px;
  background: #f0f4ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a6cf7;
  flex-shrink: 0;
}

.status-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.status-header .client {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.hashid {
  font-size: 14px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 6px;
  font-family: monospace;
  flex-shrink: 0;
}

/* Вкладки */
.tabs {
  display: flex;
  gap: 0;
  padding: 0 32px;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafa;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #1a1a2e;
  background: #f0f0f0;
}

.tab-btn.active {
  color: #4a6cf7;
  border-bottom-color: #4a6cf7;
}

.tab-btn .badge {
  background: #4a6cf7;
  color: white;
  font-size: 11px;
  border-radius: 50%;
  padding: 1px 7px;
  margin-left: 4px;
}

.tab-content {
  padding: 0 32px 24px;
}

/* Прогресс */
.progress-section {
  padding-top: 24px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.stat-item span:last-child {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

.status-badge {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  align-self: flex-start;
}

.progress-text {
  font-size: 20px !important;
  font-weight: 700 !important;
  color: #4a6cf7 !important;
}

/* Вертикальный таймлайн */
.status-timeline {
  position: relative;
  padding: 8px 0 8px 40px;
  margin: 0;
}

.timeline-line {
  position: absolute;
  left: 14px;
  top: 16px;
  bottom: 16px;
  width: 3px;
  background: #e5e7eb;
  border-radius: 4px;
}

.timeline-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #4a6cf7, #7c9bf7);
  border-radius: 4px;
  transition: height 0.6s ease;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.3s;
  position: relative;
  z-index: 2;
}

.timeline-item.completed .timeline-dot {
  background: #4a6cf7;
  color: white;
}

.timeline-item.active .timeline-dot {
  background: #4a6cf7;
  color: white;
  box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.2);
  animation: pulse 2s infinite;
}

.timeline-item.pending .timeline-dot {
  background: #e5e7eb;
  color: #9ca3af;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 108, 247, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(74, 108, 247, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 108, 247, 0); }
}

.timeline-dot .checkmark {
  font-size: 14px;
}

.timeline-content {
  flex: 1;
  padding: 2px 0;
}

.timeline-header {
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
}

.timeline-step {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.timeline-status-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

.timeline-status-indicator {
  margin-top: 4px;
  font-size: 13px;
}

.status-done {
  color: #10b981;
  font-weight: 500;
}

.status-current {
  color: #4a6cf7;
  font-weight: 500;
}

.status-pending {
  color: #9ca3af;
}

/* Корзина */
.items-section {
  padding-top: 24px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.items-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.items-count {
  font-size: 14px;
  color: #6b7280;
}

.items-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.items-table thead {
  background: #f8fafc;
}

.items-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
}

.items-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #1a1a2e;
}

.items-table tbody tr:last-child td {
  border-bottom: none;
}

.items-table tfoot {
  background: #f8fafc;
  border-top: 2px solid #f0f0f0;
}

.items-table tfoot td {
  padding: 14px 16px;
  font-weight: 600;
}

.text-right {
  text-align: right;
}

.item-name {
  font-weight: 500;
}

.empty-items {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-items svg {
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-items p {
  margin: 0;
  font-size: 16px;
}

.items-loading,
.items-error {
  text-align: center;
  padding: 32px 20px;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #4a6cf7;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.6s linear infinite;
}

.items-error p {
  color: #ef4444;
  margin-bottom: 12px;
}

.btn-sm {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-sm.btn-primary {
  background: #4a6cf7;
  color: white;
}

.btn-sm.btn-primary:hover {
  background: #3b5de7;
}

/* Блок дебиторки */
.debt-section {
  margin-top: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid;
  transition: all 0.3s;
}

.debt-section.has-debt {
  background: #fef2f2;
  border-color: #fca5a5;
}

.debt-section.no-debt {
  background: #f0fdf4;
  border-color: #86efac;
}

.debt-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debt-label {
  font-size: 13px;
  color: #6b7280;
}

.debt-amount {
  font-size: 20px;
  font-weight: 700;
}

.debt-section.has-debt .debt-amount {
  color: #dc2626;
}

.debt-section.no-debt .debt-amount {
  color: #16a34a;
}

.debt-status {
  flex-shrink: 0;
}

.debt-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.debt-badge.debt-negative {
  background: #fca5a5;
  color: #7f1d1d;
}

.debt-badge.debt-positive {
  background: #86efac;
  color: #14532d;
}

.debt-icon {
  font-size: 16px;
}

/* Оплаты */
.payments-section {
  padding-top: 24px;
}

.payments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.payments-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.payments-summary {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.payments-total {
  color: #6b7280;
}

.payments-total strong {
  color: #1a1a2e;
}

.payments-debt {
  font-weight: 500;
}

.payments-debt.debt-positive {
  color: #16a34a;
}

.payments-debt.debt-negative {
  color: #dc2626;
}

.payments-loading,
.payments-error {
  text-align: center;
  padding: 32px 20px;
}

.payments-error p {
  color: #ef4444;
  margin-bottom: 12px;
}

.empty-payments {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-payments svg {
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-payments p {
  margin: 0;
  font-size: 16px;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #4a6cf7;
  transition: background 0.2s;
}

.payment-item:hover {
  background: #f1f5f9;
}

.payment-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.payment-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.payment-date {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.payment-comment {
  font-size: 13px;
  color: #6b7280;
}

.no-comment {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

.payment-amount {
  font-size: 18px;
  font-weight: 700;
}

.payment-amount.positive {
  color: #16a34a;
}

.payments-footer {
  margin-top: 20px;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-total-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.payment-total-label {
  font-size: 14px;
  color: #6b7280;
}

.payment-total-amount {
  font-size: 18px;
  font-weight: 700;
}

.payment-total-amount.positive {
  color: #16a34a;
}

.payment-total-amount.debt-positive {
  color: #16a34a;
}

.payment-total-amount.debt-negative {
  color: #dc2626;
}

/* Футер */
.status-footer {
  padding: 16px 32px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.note {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  border-color: #4a6cf7;
  color: #4a6cf7;
  background: #f8faff;
}

/* Загрузка */
.loading {
  text-align: center;
  color: #1a1a2e;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #4a6cf7;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: #6b7280;
  font-size: 15px;
}

/* Ошибка */
.error {
  text-align: center;
  max-width: 400px;
}

.error h2 {
  color: #ef4444;
  margin-bottom: 8px;
}

.error p {
  color: #6b7280;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #4a6cf7;
  color: white;
}

.btn-primary:hover {
  background: #3b5de7;
}

/* Адаптивность */
@media (max-width: 640px) {
  .status-header {
    padding: 20px;
    flex-direction: column;
    gap: 12px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .hashid {
    align-self: flex-start;
  }
  
  .tabs {
    padding: 0 16px;
    overflow-x: auto;
  }
  
  .tab-btn {
    padding: 12px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
  
  .tab-content {
    padding: 0 16px 16px;
  }
  
  .progress-stats {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 12px;
  }
  
  .status-timeline {
    padding-left: 32px;
  }
  
  .timeline-line {
    left: 10px;
  }
  
  .timeline-dot {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 2px;
  }
  
  .status-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px 20px;
  }
  
  .footer-left {
    width: 100%;
    justify-content: center;
  }
  
  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
  
  .items-table th,
  .items-table td {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .items-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .debt-section {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .payments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .payments-summary {
    flex-direction: column;
    gap: 4px;
  }
  
  .payment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .payments-footer {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>