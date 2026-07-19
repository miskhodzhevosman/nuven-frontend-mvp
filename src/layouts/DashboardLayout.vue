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
/*
 * ============================================
 * СТИЛИ ДЛЯ ГЛАВНОГО ЛЕЙАУТА (DashboardLayout.vue)
 * Цветовая схема: #16181C (фон), #C9A86A (золото), #D0D2D5 (текст)
 * ============================================
 */

/* ============================================
   ОСНОВНОЙ КОНТЕЙНЕР
   ============================================ */
.dashboard-container {
  display: flex;
  height: 100vh;
  background: #16181C;
  color: #D0D2D5;
}

/* ============================================
   БОКОВОЕ МЕНЮ (SIDEBAR)
   ============================================ */
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(201, 168, 106, 0.1);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* Логотип */
.logo {
  font-size: 22px;
  font-weight: 700;
  color: #C9A86A;
  text-align: center;
  padding: 12px 0 20px;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(201, 168, 106, 0.08);
  margin-bottom: 24px;
}

/* Навигация */
nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: rgba(208, 210, 213, 0.6);
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #D0D2D5;
}

.nav-item .icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* Активная ссылка */
.router-link-active {
  background: rgba(201, 168, 106, 0.1);
  color: #C9A86A;
}

.router-link-active:hover {
  background: rgba(201, 168, 106, 0.15);
}

/* ============================================
   ОСНОВНАЯ ОБЛАСТЬ КОНТЕНТА
   ============================================ */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #16181C;
}

/* ============================================
   ВЕРХНЯЯ ПАНЕЛЬ (TOPBAR)
   ============================================ */
.top-bar {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(201, 168, 106, 0.08);
  padding: 14px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.top-bar h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #C9A86A;
}

/* Кнопка выхода */
.logout-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.15);
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.25);
}

/* ============================================
   ОБЛАСТЬ РОУТЕРА (router-view)
   ============================================ */
.content > :not(.top-bar) {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  min-height: 0;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    padding: 8px 12px;
    border-right: none;
    border-bottom: 1px solid rgba(201, 168, 106, 0.08);
    flex-shrink: 0;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
  }

  .logo {
    font-size: 18px;
    padding: 4px 0;
    border-bottom: none;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  nav {
    flex-direction: row;
    gap: 4px;
    flex: 1;
    overflow-x: auto;
  }

  .nav-item {
    padding: 6px 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  .nav-item .icon {
    font-size: 16px;
    width: 20px;
  }

  .content {
    flex: 1;
    overflow: hidden;
  }

  .top-bar {
    padding: 10px 16px;
  }

  .top-bar h2 {
    font-size: 16px;
  }

  .content > :not(.top-bar) {
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  .sidebar {
    padding: 6px 8px;
    gap: 8px;
  }

  .logo {
    font-size: 16px;
    display: none;
  }

  .nav-item {
    padding: 4px 10px;
    font-size: 12px;
  }

  .nav-item .icon {
    font-size: 14px;
    width: 18px;
  }

  .top-bar {
    padding: 8px 12px;
  }

  .top-bar h2 {
    font-size: 14px;
  }

  .logout-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
}

/* ============================================
   СКРОЛЛБАР (для контента)
   ============================================ */
.content > :not(.top-bar)::-webkit-scrollbar {
  width: 6px;
}

.content > :not(.top-bar)::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.content > :not(.top-bar)::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.2);
  border-radius: 3px;
}

.content > :not(.top-bar)::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.35);
}
</style>