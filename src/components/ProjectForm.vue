<template>
  <div class="modal">
    <div class="modal-content">

      <h2>{{ projectId ? "Редактирование проекта" : "Создание проекта" }}</h2>

      <form @submit.prevent="save">

        <input v-model="form.name" placeholder="Название проекта" />

        <!-- CLIENT -->
        <div class="row">
          <select v-model="form.client">
            <option :value="null">-- клиент --</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>

          <button type="button" @click="showClientModal = true">
            + Новый клиент
          </button>
        </div>

        <!-- STATUS -->
        <select v-model="form.status">
          <option v-for="s in statuses" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>

        <div class="actions">
          <button type="submit">Сохранить</button>
          <button type="button" @click="$emit('close')">Отмена</button>
        </div>
      </form>

      <!-- CREATE CLIENT -->
      <div v-if="showClientModal" class="modal">
        <div class="modal-content">
          <h3>Новый клиент</h3>

          <input v-model="newClient.name" placeholder="Название" />
          <textarea v-model="newClient.contacts" placeholder="Контакты"></textarea>

          <button @click="createClient">Создать</button>
          <button @click="showClientModal = false">Закрыть</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const API = "http://127.0.0.1:8000"

const props = defineProps({
  projectId: Number
})

const emit = defineEmits(["close", "saved"])

const form = ref({
  name: "",
  client: null,
  status: null,
})

const clients = ref([])
const statuses = ref([])

const showClientModal = ref(false)

const newClient = ref({
  type: "CLIENT",
  name: "",
  contacts: "",
})

async function loadClients() {
  const res = await fetch(`${API}/api/crm/counterparties/?type=CLIENT`)
  clients.value = await res.json()
}

async function loadStatuses() {
  const res = await fetch(`${API}/api/crm/project-statuses/`)
  statuses.value = await res.json()
}

async function loadProject() {
  if (!props.projectId) return

  const res = await fetch(`${API}/api/crm/projects/${props.projectId}/`)
  const data = await res.json()

  form.value = {
    name: data.name,
    client: data.client,
    status: data.status,
  }
}

async function save() {
  const url = props.projectId
    ? `${API}/api/crm/projects/${props.projectId}/`
    : `${API}/api/crm/projects/`

  const method = props.projectId ? "PUT" : "POST"

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form.value),
  })

  emit("saved")
}

async function createClient() {
  const res = await fetch(`${API}/api/crm/counterparties/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newClient.value),
  })

  const created = await res.json()

  clients.value.push(created)
  form.value.client = created.id

  showClientModal.value = false

  newClient.value = {
    type: "CLIENT",
    name: "",
    contacts: "",
  }
}

onMounted(async () => {
  await Promise.all([
    loadClients(),
    loadStatuses(),
    loadProject(),
  ])
})
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 420px;
  background: #151922;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

h2, h3 {
  margin: 0 0 16px 0;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  background: #0f1115;
  border: 1px solid #2a2f3d;
  color: #e6e6e6;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  outline: none;
  transition: 0.2s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2d6cdf;
  box-shadow: 0 0 0 2px rgba(45,108,223,0.25);
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row select {
  flex: 1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

button {
  background: #2d6cdf;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #3b7cff;
}

/* secondary button (отмена) */
button[type="button"] {
  background: #2a2f3d;
}

button[type="button"]:hover {
  background: #353c4f;
}
</style>
