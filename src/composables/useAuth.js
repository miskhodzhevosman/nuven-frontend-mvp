// src/composables/useAuth.js
import { reactive, computed } from 'vue';
import { 
  httpGet, 
  httpPost, 
  setTokens, 
  clearTokens, 
  getAccessToken 
} from '@/api/http';

const state = reactive({
  user: null,
  loading: false,
  ready: false,
});

async function initAuth() {
  state.loading = true;
  try {
    // Проверяем наличие токена
    const token = getAccessToken();
    if (!token) {
      console.log('👤 No token found');
      state.user = null;
      state.ready = true;
      return;
    }

    // Получаем данные пользователя
    const response = await httpGet('/api/me', { throwOnError: false });
    
    if (response.ok) {
      state.user = await response.json();
      console.log('👤 User authenticated:', state.user?.username);
    } else {
      // Если 401 - токен невалидный
      clearTokens();
      state.user = null;
      console.log('👤 Token invalid, cleared');
    }
  } catch (error) {
    console.warn('⚠️ Auth initialization error:', error);
    state.user = null;
  } finally {
    state.loading = false;
    state.ready = true;
  }
}

async function login(username, password) {
  console.log('🔐 Attempting login for:', username);

  try {
    // 1. Отправляем запрос на получение токенов
    const data = await httpPost('/api/token/', { 
      username, 
      password 
    });
    
    console.log('✅ Login successful, tokens received');
    
    // 2. Сохраняем токены
    setTokens(data.access, data.refresh);
    
    // 3. Получаем данные пользователя
    const response = await httpGet('/api/me', { throwOnError: false });
    if (response.ok) {
      state.user = await response.json();
      console.log('👤 User data loaded:', state.user?.username);
    } else {
      throw new Error('Failed to load user data');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    clearTokens();
    state.user = null;
    throw error;
  }
}

async function logout() {
  try {
    // Можно отправить запрос на logout если нужно
    // await httpPost('/api/logout', {});
    console.log('👋 User logged out');
  } catch (error) {
    console.warn('⚠️ Logout error:', error);
  } finally {
    clearTokens();
    state.user = null;
  }
}

const isAuthenticated = computed(() => {
  return !!state.user && !!getAccessToken();
});

export function useAuth() {
  return {
    state,
    initAuth,
    login,
    logout,
    isAuthenticated,
  };
}