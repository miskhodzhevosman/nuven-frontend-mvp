<template>
  <div class="projects">
    <div class="header">
      <h1>Проекты</h1>
      <button @click="openCreate">+ Создать проект</button>
    </div>

    <table v-if="projects.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Клиент</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="p in projects" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ getClientName(p.client) }}</td>
          <td>{{ getStatusName(p.status) }}</td>
          <td>
            <button @click="editProject(p.id)">Редактировать</button>
            <button @click="deleteProject(p.id)">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>Проектов нет</p>

    <ProjectForm
      v-if="isFormOpen"
      :project-id="selectedProjectId"
      @close="closeForm"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import ProjectForm from "@/components/ProjectForm.vue"

const API = "http://127.0.0.1:8000"

const projects = ref([])
const clients = ref([])
const statuses = ref([])

const isFormOpen = ref(false)
const selectedProjectId = ref(null)

async function fetchProjects() {
  const res = await fetch(`${API}/api/crm/projects/`)
  projects.value = await res.json()
}

async function fetchClients() {
  const res = await fetch(`${API}/api/crm/counterparties/?type=CLIENT`)
  clients.value = await res.json()
}

async function fetchStatuses() {
  const res = await fetch(`${API}/api/crm/project-statuses/`)
  statuses.value = await res.json()
}

function getClientName(id) {
  return clients.value.find(c => c.id === id)?.name || "-"
}

function getStatusName(id) {
  return statuses.value.find(s => s.id === id)?.name || "-"
}

function openCreate() {
  selectedProjectId.value = null
  isFormOpen.value = true
}

function editProject(id) {
  selectedProjectId.value = id
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

async function deleteProject(id) {
  await fetch(`${API}/api/crm/projects/${id}/`, {
    method: "DELETE",
  })
  await fetchProjects()
}

function onSaved() {
  isFormOpen.value = false
  fetchProjects()
}

onMounted(async () => {
  await Promise.all([
    fetchProjects(),
    fetchClients(),
    fetchStatuses(),
  ])
})
</script>

<style scoped>
.projects {
  padding: 24px;
  background: #0f1115;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

h1 {
  font-size: 22px;
  font-weight: 600;
}

button {
  background: #2d6cdf;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #3b7cff;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #151922;
  border-radius: 12px;
  overflow: hidden;
}

th, td {
  padding: 12px;
  border-bottom: 1px solid #232838;
  text-align: left;
  font-size: 14px;
  color: #e6e6e6;
}

th {
  background: #1b2030;
  color: #aab3c5;
}

tr:hover {
  background: #1a1f2d;
}

p {
  color: #9aa3b2;
}
</style>