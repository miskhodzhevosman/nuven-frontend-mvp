import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/supplies/factories/'

export const getFactories = async () => {
  return axios.get(API_URL)
}

export const createFactory = async (payload) => {
  return axios.post(API_URL, payload)
}

export const updateFactory = async (id, payload) => {
  return axios.put(`${API_URL}${id}/`, payload)
}

export const deleteFactory = async (id) => {
  return axios.delete(`${API_URL}${id}/`)
}