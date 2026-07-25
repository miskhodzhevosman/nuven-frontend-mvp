<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Вход в систему</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Имя пользователя</label>
          <!-- Заменили type="email" на type="text" и v-model -->
          <input 
            v-model="username" 
            type="text" 
            required 
            placeholder="admin" 
          />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="******" 
          />
        </div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
        
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()
const username = ref('') // Было email
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function handleLogin() {
  loading.value = true
  error.value = null
  
  try {
    // Передаем username вместо email
    await login(username.value, password.value)
  } catch (e) {
    error.value = 'Неверное имя пользователя или пароль'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/*
 * ============================================
 * СТИЛИ ДЛЯ СТРАНИЦЫ ВХОДА (login.vue)
 * Цветовая схема: #F8F9FA (фон), #2C3E50 (акцент), #1A1A1A (текст)
 * ============================================
 */

/* ============================================
   ОСНОВНОЙ КОНТЕЙНЕР
   ============================================ */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #F8F9FA;
  padding: 20px;
}

/* ============================================
   КАРТОЧКА ВХОДА
   ============================================ */
.login-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 40px 36px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12);
}

/* ============================================
   ЛОГОТИП
   ============================================ */
.login-card .logo {
  text-align: center;
  margin-bottom: 32px;
}

.login-card .logo h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0;
  letter-spacing: 1px;
}

.login-card .logo p {
  color: rgba(26, 26, 26, 0.4);
  font-size: 14px;
  margin: 6px 0 0;
}

/* ============================================
   ЗАГОЛОВОК ФОРМЫ
   ============================================ */
.login-card h2 {
  text-align: center;
  color: #1A1A1A;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px;
}

/* ============================================
   ПОЛЯ ФОРМЫ
   ============================================ */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.5);
  margin-bottom: 4px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: rgba(26, 26, 26, 0.2);
}

.form-group input:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

/* ============================================
   КНОПКА ВХОДА
   ============================================ */
.login-card button {
  width: 100%;
  padding: 10px 16px;
  background: #2C3E50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.login-card button:hover:not(:disabled) {
  background: #34495E;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.25);
}

.login-card button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ============================================
   ОШИБКИ
   ============================================ */
.error {
  color: #DC2626;
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  padding: 8px 12px;
  background: rgba(220, 38, 38, 0.06);
  border-radius: 6px;
  border: 1px solid rgba(220, 38, 38, 0.1);
}

/* ============================================
   ДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ
   ============================================ */
.login-card .footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: rgba(26, 26, 26, 0.3);
  font-size: 12px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
    max-width: 100%;
    margin: 0 8px;
  }

  .login-card .logo h1 {
    font-size: 24px;
  }

  .login-card .logo p {
    font-size: 13px;
  }

  .login-card h2 {
    font-size: 18px;
    margin-bottom: 20px;
  }

  .form-group input {
    padding: 8px 12px;
    font-size: 13px;
  }

  .login-card button {
    padding: 8px 14px;
    font-size: 14px;
  }
}

@media (max-width: 360px) {
  .login-card {
    padding: 20px 16px;
  }

  .login-card .logo h1 {
    font-size: 20px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group input {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>