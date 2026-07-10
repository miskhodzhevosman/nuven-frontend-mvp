// src/api/factories.js
import { httpGet, httpPost, httpPut, httpDelete } from './http';

const BASE_URL = '/api/supplies/factories/';

export async function getFactories() {
  const response = await httpGet(BASE_URL);
  const data = await response.json(); // 👈 Добавляем .json()
  return data.items ?? data;
}

export async function createFactory(payload) {
  return await httpPost(BASE_URL, payload);
}

export async function updateFactory(id, payload) {
  return await httpPut(`${BASE_URL}${id}/`, payload);
}

export async function deleteFactory(id) {
  return await httpDelete(`${BASE_URL}${id}/`);
}