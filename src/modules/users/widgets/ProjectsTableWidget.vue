<!-- ../widgets/ProjectsTableWidget.vue -->
<template>
  <div class="projects-table-widget">
    <!-- Заголовок виджета -->
    <div class="widget-header">
      <h2 class="widget-title">📋 Проекты</h2>
      <div class="widget-actions">
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>🔄</span>
        </button>
        <span class="total-count" v-if="projects.length > 0">
          Всего: {{ projects.length }}
        </span>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters-bar">
      <div class="filter-group">
        <input
          type="text"
          v-model="filters.search"
          placeholder="🔍 Поиск по названию..."
          @input="applyFilters"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.status" @change="applyFilters" class="filter-select">
          <option value="">Все статусы</option>
          <option v-for="status in statuses" :key="status.id" :value="status.id">
            {{ status.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.client" @change="applyFilters" class="filter-select">
          <option value="">Все клиенты</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
          </option>
        </select>
      </div>
      <button 
        v-if="hasActiveFilters" 
        @click="clearFilters" 
        class="btn-clear-filters"
        title="Очистить фильтры"
      >
        ✕
      </button>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-message">
      <span>❌ {{ error }}</span>
      <button @click="refreshData" class="btn-retry">Повторить</button>
    </div>

    <!-- Таблица -->
    <div v-else class="table-wrapper">
      <table class="projects-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" class="sortable">
              Название
              <span class="sort-icon">{{ getSortIcon('name') }}</span>
            </th>
            <th @click="sortBy('client_name')" class="sortable">
              Клиент
              <span class="sort-icon">{{ getSortIcon('client_name') }}</span>
            </th>
            <th @click="sortBy('tech_manager_name')" class="sortable">
              Менеджер
              <span class="sort-icon">{{ getSortIcon('tech_manager_name') }}</span>
            </th>
            <th @click="sortBy('status_name')" class="sortable">
              Статус
              <span class="sort-icon">{{ getSortIcon('status_name') }}</span>
            </th>
            <th @click="sortBy('full_location_name')" class="sortable">
              Локация
              <span class="sort-icon">{{ getSortIcon('full_location_name') }}</span>
            </th>
            <th @click="sortBy('created_at')" class="sortable">
              Создан
              <span class="sort-icon">{{ getSortIcon('created_at') }}</span>
            </th>
            <th class="actions-column">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="project in paginatedProjects" 
            :key="project.id"
            class="project-row"
            @click="openProject(project.id)"
          >
            <td class="project-name-cell">
              <span class="project-name">{{ project.name }}</span>
            </td>
            <td class="client-cell">
              <span class="client-name">{{ project.client_name || `#${project.client}` }}</span>
            </td>
            <td class="manager-cell">
              <span class="manager-name">{{ project.tech_manager_name || `#${project.tech_manager}` }}</span>
            </td>
            <td class="status-cell">
              <span 
                class="status-badge" 
                :style="{ backgroundColor: getStatusColor(project.status) }"
              >
                {{ project.status_name || `Статус #${project.status}` }}
              </span>
            </td>
            <td class="location-cell">
              {{ project.full_location_name || '—' }}
            </td>
            <td class="date-cell">
              {{ formatDate(project.created_at) }}
            </td>
            <td class="actions-cell">
              <button 
                @click.stop="openProject(project.id)" 
                class="btn-open"
                title="Открыть проект"
              >
                ▶
              </button>
            </td>
          </tr>
          <tr v-if="filteredProjects.length === 0" class="empty-row">
            <td colspan="7">
              <div class="empty-state">
                <span>📭 Нет проектов для отображения</span>
                <span v-if="hasActiveFilters" class="empty-hint">
                  Попробуйте изменить фильтры
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div v-if="filteredProjects.length > 0" class="pagination-bar">
      <div class="pagination-info">
        <span>
          Показано {{ (currentPage - 1) * itemsPerPage + 1 }} - 
          {{ Math.min(currentPage * itemsPerPage, filteredProjects.length) }} 
          из {{ filteredProjects.length }}
        </span>
      </div>
      <div class="pagination-controls">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ◀
        </button>
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          ▶
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue'
import { useProjectsStore } from '@/modules/projects/store'
import { useRouter } from 'vue-router'

export default {
  name: 'ProjectsTableWidget',

  props: {
    /** Максимальное количество записей на странице */
    itemsPerPage: {
      type: Number,
      default: 10
    },
    /** Автоматически загружать данные при монтировании */
    autoLoad: {
      type: Boolean,
      default: true
    },
    /** Фильтр по клиенту (если нужно показать проекты только для конкретного клиента) */
    clientId: {
      type: Number,
      default: null
    }
  },

  emits: ['project-selected', 'data-loaded', 'error'],

  setup(props, { emit }) {
    const store = useProjectsStore()
    const router = useRouter()

    // Локальное состояние
    const filters = ref({
      search: '',
      status: '',
      client: '',
      manager: ''
    })

    const currentPage = ref(1)
    const sortField = ref('created_at')
    const sortOrder = ref('desc') // 'asc' или 'desc'

    // Загрузка данных
    const loadData = async () => {
      try {
        await Promise.all([
          store.fetchProjects(),
          store.fetchStatuses(),
          store.fetchClients(),
          store.fetchManagers()
        ])
        emit('data-loaded', store.projects)
      } catch (error) {
        console.error('Error loading projects data:', error)
        emit('error', error)
      }
    }

    // Жизненный цикл
    onMounted(async () => {
      if (props.autoLoad) {
        await loadData()
      }
    })

    // Фильтрация проектов
    const filteredProjects = computed(() => {
      let result = [...store.projects]

      // Фильтр по клиенту из пропсов
      if (props.clientId) {
        result = result.filter(p => p.client === props.clientId)
      }

      // Поиск по названию
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        result = result.filter(p =>
          p.name && p.name.toLowerCase().includes(searchLower)
        )
      }

      // Фильтр по статусу
      if (filters.value.status) {
        result = result.filter(p => p.status === Number(filters.value.status))
      }

      // Фильтр по клиенту
      if (filters.value.client) {
        result = result.filter(p => p.client === Number(filters.value.client))
      }

      // Фильтр по менеджеру
      if (filters.value.manager) {
        result = result.filter(p => p.tech_manager === Number(filters.value.manager))
      }

      return result
    })

    // Сортировка
    const sortedProjects = computed(() => {
      const sorted = [...filteredProjects.value]
      
      sorted.sort((a, b) => {
        let aVal = a[sortField.value] || ''
        let bVal = b[sortField.value] || ''
        
        // Приведение к строке для сравнения
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
        
        if (sortOrder.value === 'asc') {
          return aVal.localeCompare(bVal)
        } else {
          return bVal.localeCompare(aVal)
        }
      })
      
      return sorted
    })

    // Пагинация
    const paginatedProjects = computed(() => {
      const start = (currentPage.value - 1) * props.itemsPerPage
      const end = start + props.itemsPerPage
      return sortedProjects.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(sortedProjects.value.length / props.itemsPerPage)
    })

    // Методы
    const refreshData = async () => {
      await loadData()
    }

    const applyFilters = () => {
      currentPage.value = 1
    }

    const clearFilters = () => {
      filters.value = {
        search: '',
        status: '',
        client: '',
        manager: ''
      }
      currentPage.value = 1
    }

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
      currentPage.value = 1
    }

    const getSortIcon = (field) => {
      if (sortField.value !== field) return '↕'
      return sortOrder.value === 'asc' ? '↑' : '↓'
    }

    const openProject = (projectId) => {
      emit('project-selected', projectId)
      router.push(`/projects/${projectId}`)
    }

    // Вспомогательные методы
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const getStatusColor = (statusId) => {
      const colors = {
        1: '#4CAF50',  // Активный
        2: '#2196F3',  // В процессе
        3: '#FFC107',  // Ожидание
        4: '#F44336',  // Остановлен
        5: '#9E9E9E'   // Завершен
      }
      return colors[statusId] || '#9E9E9E'
    }

    const hasActiveFilters = computed(() => {
      return Object.values(filters.value).some(value => value !== '') || props.clientId
    })

    // Сброс пагинации при изменении фильтров
    watch(() => filteredProjects.value, () => {
      if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value)
      }
    })

    return {
      // Данные из store
      projects: computed(() => store.projects),
      loading: computed(() => store.loading),
      error: computed(() => store.error),
      statuses: computed(() => store.statuses),
      clients: computed(() => store.clients),
      managers: computed(() => store.managers),

      // Локальное состояние
      filters,
      currentPage,
      sortField,
      sortOrder,

      // Computed
      filteredProjects,
      sortedProjects,
      paginatedProjects,
      totalPages,
      hasActiveFilters,

      // Методы
      refreshData,
      applyFilters,
      clearFilters,
      changePage,
      sortBy,
      getSortIcon,
      openProject,
      formatDate,
      getStatusColor
    }
  }
}
</script>

<style scoped>
.projects-table-widget {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Заголовок */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.widget-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.widget-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-refresh {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-refresh:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.total-count {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

/* Фильтры */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-clear-filters {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  align-self: center;
}

.btn-clear-filters:hover {
  background: #c82333;
}

/* Таблица */
.table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.projects-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.projects-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
  user-select: none;
}

.projects-table th.sortable {
  cursor: pointer;
  transition: background 0.2s;
}

.projects-table th.sortable:hover {
  background: #e9ecef;
}

.sort-icon {
  margin-left: 4px;
  font-size: 12px;
  color: #6c757d;
}

.projects-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.projects-table tbody tr {
  transition: background 0.2s;
  cursor: pointer;
}

.projects-table tbody tr:hover {
  background: #f8f9fa;
}

.project-row {
  cursor: pointer;
}

.project-row:hover {
  background: #f1f3f5;
}

.project-name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.client-name,
.manager-name {
  color: #495057;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.date-cell {
  color: #6c757d;
  font-size: 13px;
}

.actions-column {
  width: 60px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.btn-open {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-open:hover {
  background: #e3f2fd;
}

/* Состояния */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #6c757d;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #dc3545;
  background: #f8d7da;
  border-radius: 6px;
  margin: 12px 24px;
}

.btn-retry {
  padding: 4px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #0056b3;
}

/* Пустое состояние */
.empty-row td {
  padding: 40px 20px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #6c757d;
}

.empty-hint {
  font-size: 13px;
  color: #adb5bd;
}

/* Пагинация */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pagination-info {
  font-size: 14px;
  color: #6c757d;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 4px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #495057;
  padding: 0 8px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .projects-table {
    font-size: 13px;
  }
  
  .projects-table th,
  .projects-table td {
    padding: 8px 12px;
  }
  
  .pagination-bar {
    flex-direction: column;
    gap: 8px;
  }
}
</style>