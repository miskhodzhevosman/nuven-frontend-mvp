<template>
  <div class="dashboard-container">
    <!-- Боковое меню -->
    <aside class="sidebar">
      <div class="logo">My ERP</div>
      <nav>
        <router-link to="/supply" class="nav-item">
          📦 Поставки
        </router-link>
        <router-link to="/projects" class="nav-item">
          🚀 Проекты
        </router-link>
        <router-link to="/finance" class="nav-item">
          💰 Финансы
        </router-link>
      </nav>
    </aside>

    <!-- Основная область контента -->
    <main class="content">
      <header class="top-bar">
        <h2>{{ currentTitle }}</h2>
        <button @click="logout" class="logout-btn">Выйти</button>
      </header>
      
      <!-- Сюда Vue Router будет подставлять компоненты модулей -->
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Динамический заголовок из meta-данных роута
const currentTitle = computed(() => route.meta.title || 'Дашборд')

function logout() {
  // Пока просто очищаем токен и редиректим
  localStorage.removeItem('access_token')
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
}

.nav-item {
  display: block;
  padding: 12px;
  color: #ecf0f1;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 5px;
  transition: background 0.3s;
}

.nav-item:hover {
  background-color: #34495e;
}

/* Активная ссылка */
.router-link-active {
  background-color: #1abc9c;
  color: white;
}

.content {
  flex: 1;
  background-color: #f5f6fa;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: white;
  padding: 15px 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>