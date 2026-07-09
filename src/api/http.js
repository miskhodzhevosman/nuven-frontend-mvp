// src/api/http.js
const API_BASE = 'http://localhost:8000'; // или 'http://127.0.0.1:8000' — используй единый хост

// ============================================
// 1. Утилиты для работы с cookies
// ============================================

function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()) : null;
}

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ============================================
// 2. CSRF токен
// ============================================

async function ensureCsrf() {
  // 1. Проверяем существующий токен
  let csrf = getCookie('csrftoken');
  if (csrf) {
    console.debug('✅ CSRF token already exists');
    return csrf;
  }

  console.debug('🔄 CSRF token missing, requesting...');

  try {
    // 2. Запрашиваем новый токен
    const response = await fetch(`${API_BASE}/api/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get CSRF token: ${response.status}`);
    }

    // 3. Проверяем, что токен появился
    csrf = getCookie('csrftoken');
    
    if (csrf) {
      console.debug('✅ CSRF token obtained successfully');
    } else {
      console.warn('⚠️ CSRF token not found in document.cookie');
      console.log('📌 Check Application → Cookies →', API_BASE);
    }

    return csrf;
  } catch (error) {
    console.error('❌ Error obtaining CSRF token:', error);
    throw error;
  }
}

// ============================================
// 3. Основные HTTP методы
// ============================================

async function withCsrfHeaders() {
  let csrf = getCookie('csrftoken');
  if (!csrf) csrf = await ensureCsrf();
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRFToken': csrf || '',
  };
}

// --- GET ---
async function httpGet(url, options = {}) {
  const { throwOnError = true, headers = {} } = options;
  
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    credentials: 'include',  // ⚠️ ОБЯЗАТЕЛЬНО!
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
  });

  if (!response.ok && throwOnError) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  return response;
}

// --- POST ---
async function httpPost(url, data = {}) {
  const headers = await withCsrfHeaders();
  
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    credentials: 'include',  // ⚠️ ОБЯЗАТЕЛЬНО!
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

// --- PUT ---
async function httpPut(url, data = {}) {
  const headers = await withCsrfHeaders();
  
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    credentials: 'include',  // ⚠️ ОБЯЗАТЕЛЬНО!
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

// --- PATCH ---
async function httpPatch(url, data = {}) {
  const headers = await withCsrfHeaders();
  
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH',
    credentials: 'include',  // ⚠️ ОБЯЗАТЕЛЬНО!
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

// --- DELETE ---
async function httpDelete(url, options = {}) {
  const { data, throwOnError = true } = options;
  const headers = await withCsrfHeaders();
  
  const fetchOptions = {
    method: 'DELETE',
    credentials: 'include',  // ⚠️ ОБЯЗАТЕЛЬНО!
    headers,
  };

  // Некоторые API принимают тело в DELETE, некоторые — нет
  if (data !== undefined) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${url}`, fetchOptions);

  // DELETE может возвращать 204 No Content
  if (!response.ok && throwOnError) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  // Парсим JSON только если есть тело ответа
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
}

// ============================================
// 4. Утилиты для работы с ответами
// ============================================

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  
  return null;
}

function handleError(error) {
  console.error('API Error:', error);
  // Можно добавить логирование или отправку ошибок в сервис мониторинга
  throw error;
}

// ============================================
// 5. Экспорты
// ============================================

export {
  // Основные методы
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  
  // Утилиты
  ensureCsrf,
  getCookie,
  setCookie,
  deleteCookie,
  handleResponse,
  handleError,
};