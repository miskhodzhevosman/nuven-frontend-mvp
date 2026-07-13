// src/api/http.js
const API_BASE = 'http://127.0.0.1:8000';

// ============================================
// 1. Работа с токенами
// ============================================

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ============================================
// 2. Основные HTTP методы с JWT
// ============================================

function getHeaders(additionalHeaders = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function fetchWithAuth(url, options = {}) {
  const { method = 'GET', data, headers = {}, throwOnError = true } = options;
  
  const fetchOptions = {
    method,
    credentials: 'omit', // JWT не использует cookies
    headers: getHeaders(headers),
  };
  
  if (data !== undefined) {
    fetchOptions.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${url}`, fetchOptions);
  
  // Если 401 - пробуем обновить токен
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Повторяем запрос с новым токеном
      fetchOptions.headers = getHeaders(headers);
      const retryResponse = await fetch(`${API_BASE}${url}`, fetchOptions);
      
      if (!retryResponse.ok && throwOnError) {
        const text = await retryResponse.text().catch(() => '');
        throw new Error(`${retryResponse.status}: ${text || retryResponse.statusText}`);
      }
      
      return retryResponse;
    } else {
      // Не удалось обновить - разлогиниваем
      clearTokens();
      throw new Error('Session expired');
    }
  }
  
  if (!response.ok && throwOnError) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response;
}

// ============================================
// 3. Обновление токена
// ============================================

let refreshPromise = null;

async function refreshToken() {
  // Если уже идет обновление - ждем его
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });
      
      if (!response.ok) {
        clearTokens();
        return false;
      }
      
      const data = await response.json();
      setTokens(data.access, null); // refresh не обновляем
      return true;
    } catch (error) {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

// ============================================
// 4. Основные HTTP методы (обертка над fetchWithAuth)
// ============================================

async function httpGet(url, options = {}) {
  const { throwOnError = true, headers = {} } = options;
  return fetchWithAuth(url, {
    method: 'GET',
    headers,
    throwOnError,
  });
}

// api/http.js
async function httpPost(url, data = {}, options = {}) {
  const { throwOnError = true, headers = {} } = options;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    data,
    headers,
    throwOnError,
  });
  
  // Логируем ВСЁ
  console.log(`📡 POST ${url}`);
  console.log('Статус:', response.status);
  console.log('Заголовки:', [...response.headers.entries()]);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') && response.status !== 204) {
    const json = await response.json();
    console.log('📦 JSON ответ:', json);
    console.log('🆔 ID в ответе:', json?.id);
    console.log('Ключи ответа:', Object.keys(json));
    return json;
  }
  
  return null;
}

async function httpPut(url, data = {}, options = {}) {
  const { throwOnError = true, headers = {} } = options;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    data,
    headers,
    throwOnError,
  });
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
}

async function httpPatch(url, data = {}, options = {}) {
  const { throwOnError = true, headers = {} } = options;
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    data,
    headers,
    throwOnError,
  });
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
}

async function httpDelete(url, options = {}) {
  const { data, throwOnError = true, headers = {} } = options;
  const fetchOptions = {
    method: 'DELETE',
    headers,
    throwOnError,
  };
  
  if (data !== undefined) {
    fetchOptions.data = data;
  }
  
  const response = await fetchWithAuth(url, fetchOptions);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
}

// src/api/http.js - добавляем в конец файла

// ============================================
// 5. Утилиты для работы с ответами
// ============================================

function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}

// ============================================
// 6. Экспорты (добавляем handleResponse)
// ============================================

export {
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  refreshToken,
  handleResponse, // 👈 Добавляем сюда
};
