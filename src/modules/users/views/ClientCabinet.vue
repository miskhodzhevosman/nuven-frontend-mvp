<template>
  <div class="client-cabinet-page">
    <!-- Шапка страницы -->
    <header class="cabinet-header">
      <div class="header-content">
        <h1>🏢 Клиентский кабинет</h1>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <button @click="logout" class="btn-logout">Выйти</button>
        </div>
      </div>
    </header>

    <!-- Основное содержимое -->
    <main class="cabinet-content">
      <div class="container">
        <!-- Виджет с таблицей проектов -->
        <ProjectsTable 
          :client-id="clientId"
          @project-selected="openProject"
          @data-loaded="handleDataLoaded"
          @error="handleError"
        />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// Правильный импорт - ProjectsTable.vue
import ProjectsTable from '@/modules/users/widgets/ProjectsTableWidget.vue'
// Или если виджет лежит в общей папке widgets
// import ProjectsTable from '@/widgets/ProjectsTable.vue'

export default {
  name: 'ClientCabinet',
  
  components: {
    ProjectsTable
  },
  
  setup() {
    const router = useRouter()
    
    const userName = ref('Клиент')
    const clientId = ref(null) // ID текущего клиента
    
    onMounted(() => {
      // Загружаем данные пользователя
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      userName.value = user.name || user.username || 'Клиент'
      clientId.value = user.client_id || null
    })
    
    const openProject = (projectId) => {
      router.push(`/client-cabinet/project/${projectId}`)
    }
    
    const handleDataLoaded = (projects) => {
      console.log('Проекты загружены:', projects.length)
    }
    
    const handleError = (error) => {
      console.error('Ошибка:', error)
    }
    
    const logout = () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    
    return {
      userName,
      clientId,
      openProject,
      handleDataLoaded,
      handleError,
      logout
    }
  }
}
</script>

<style scoped>
.client-cabinet-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Шапка */
.cabinet-header {
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  padding: 0 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.cabinet-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

.btn-logout {
  padding: 6px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #c82333;
}

/* Основное содержимое */
.cabinet-content {
  padding: 24px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Адаптивность */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 12px 0;
    gap: 8px;
  }
  
  .cabinet-header h1 {
    font-size: 20px;
  }
}
</style>