// src/composables/useAuth.js
import { reactive, computed } from 'vue';
import { ensureCsrf, httpGet, httpPost } from '@/api/http';

const state = reactive({
    user: null,
    loading: false,
    ready: false,
});

async function initAuth() {
    state.loading = true;
    try {
        // 1. Получаем CSRF токен
        await ensureCsrf();

        // 2. Проверяем сессию (401/403 - это нормально)
        const response = await httpGet('/api/me', { throwOnError: false });
        
        if (response.ok) {
            state.user = await response.json();
            console.log('👤 User authenticated:', state.user?.username);
        } else {
            console.log('👤 User not authenticated (status:', response.status, ')');
            state.user = null;
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

    // 1. Убеждаемся, что CSRF токен есть
    const csrf = await ensureCsrf();
    if (!csrf) {
        throw new Error('CSRF token not available');
    }

    // 2. Отправляем логин
    const result = await httpPost('/api/login', { username, password });
    console.log('✅ Login successful');

    // 3. Получаем данные пользователя
    const response = await httpGet('/api/me', { throwOnError: false });
    if (response.ok) {
        state.user = await response.json();
        console.log('👤 User data loaded:', state.user?.username);
    } else {
        throw new Error('Failed to load user data');
    }

    return result;
}

async function logout() {
    try {
        await httpPost('/api/logout', {});
    } catch (error) {
        console.warn('⚠️ Logout error:', error);
    } finally {
        state.user = null;
        console.log('👋 User logged out');
    }
}

const isAuthenticated = computed(() => !!state.user);

export function useAuth() {
    return {
        state,
        initAuth,
        login,
        logout,
        isAuthenticated,
    };
}