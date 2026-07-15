<!-- src/layouts/DashboardLayout.vue -->
<template>
  <div class="layout">
    <aside class="sidebar panel">
      <div class="brand">Мой Дашборд</div>
      
      <nav class="menu">
        <RouterLink to="/" exact-active-class="active">
          Дашборд
        </RouterLink>
        
        <RouterLink to="factory" exact-active-class="active">
          Фабрики
        </RouterLink>
        
        <RouterLink to="/projects" exact-active-class="active" data-tour="projects">
          Проекты
        </RouterLink>
        
      </nav>
      
      <div class="spacer"></div>
      
      <div class="user panel">
        <div class="row" style="align-items:center; justify-content: space-between;">
          <div class="col">
            <span class="muted" style="font-size:12px;">Аккаунт</span>
            <strong>{{ user?.username }}</strong>
          </div>
          <button class="danger" @click="onLogout" style="padding:8px 10px;">
            Выйти
          </button>
        </div>
      </div>
    </aside>
    
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
const { state, logout } = useAuth();
const user = computed(() => state.user);

async function onLogout() {
  await logout();
  router.replace({ name: 'login' });
}
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  gap: 14px;
  padding: 14px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.brand { 
  font-weight: 700; 
  letter-spacing: 0.4px; 
}

.menu { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.menu a {
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.menu a:hover { 
  background: #141822; 
  border-color: var(--border); 
}

.menu a.active { 
  background: #1a1f2b; 
  border-color: var(--border); 
}

.spacer { flex: 1; }
.user { padding: 12px; }

.content {
  padding: 14px;
  background: 
    radial-gradient(800px 500px at 10% 15%, #121622, transparent),
    radial-gradient(800px 500px at 90% 85%, #121622, transparent),
    var(--bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: auto;
}
</style>