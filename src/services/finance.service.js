const BASE_URL = 'http://127.0.0.1:8000/api'

export async function getFinanceReport() {
  const res = await fetch(`${BASE_URL}/finance/report/`)

  if (!res.ok) {
    throw new Error('Failed to load finance report')
  }

  return await res.json()
}

export async function getProjectFinanceReport(projectId) {
  const res = await fetch(`${BASE_URL}/finance/projects/${projectId}/report/`)

  if (!res.ok) {
    throw new Error(`Failed to load finance report for project ${projectId}`)
  }

  return await res.json()
}

