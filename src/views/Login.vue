<!-- src/views/Login.vue -->
<template>
  <div class="login-wrap">
    <div class="panel login-card">
      <h2>Вход</h2>
      <p class="muted">Введите учетные данные</p>
      
      <form @submit.prevent="onSubmit" class="col">
        <input 
          v-model.trim="username" 
          type="text" 
          placeholder="Имя пользователя" 
          autocomplete="username" 
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="Пароль" 
          autocomplete="current-password" 
        />
        <button class="primary" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
        <p v-if="error" style="color: var(--danger); margin: 0;">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await login(username.value, password.value);
    const next = route.query.next || '/';
    router.replace(next);
  } catch (e) {
    error.value = e.message || 'Ошибка входа';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: 
    radial-gradient(1000px 600px at 20% 10%, #151a24, transparent),
    radial-gradient(1000px 600px at 80% 90%, #151a24, transparent),
    var(--bg);
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 24px;
}

h2 { margin: 0 0 8px; }
form { margin-top: 16px; }
</style>