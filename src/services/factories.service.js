const BASE_URL = 'http://127.0.0.1:8000/api/supplies/factories/'

export async function getFactories() {
  const res = await fetch(BASE_URL)
  const data = await res.json()
  return data.items ?? data
}

export async function createFactory(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return await res.json()
}

export async function updateFactory(id, payload) {
  const res = await fetch(`${BASE_URL}${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return await res.json()
}

export async function deleteFactory(id) {
  await fetch(`${BASE_URL}${id}/`, {
    method: 'DELETE'
  })
}