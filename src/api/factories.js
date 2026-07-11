// src/api/factories.js
import { httpGet, httpPost, httpPut, httpDelete } from './http';

const BASE_URL = '/api/supplies/factories/';

export async function getFactories() {
  const response = await httpGet(BASE_URL);
  // DRF обычно возвращает массив напрямую для ListAPIView или объект с results
  const data = await response.json();
  return Array.isArray(data) ? data : (data.results || data.items || []);
}

export async function createFactory(payload) {
  // payload должен содержать: name, address, contacts
  return await httpPost(BASE_URL, payload);
}

export async function updateFactory(id, payload) {
  return await httpPut(`${BASE_URL}${id}/`, payload);
}

export async function deleteFactory(id) {
  return await httpDelete(`${BASE_URL}${id}/`);
}