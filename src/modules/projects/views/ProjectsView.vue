<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const router = useRouter()
const store = useProjectsStore()
const { projects, loading, error, count } = storeToRefs(store)

onMounted(() => {
  store.fetchProjects().catch(() => {})
})

function open(id) {
  router.push({ name: 'project-detail', params: { id } })
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h1>Проекты</h1>
        <p class="muted">Всего: {{ count }}</p>
      </div>
    </header>

    <div v-if="error" class="alert alert-error">
      <strong>Ошибка:</strong> <span>{{ error }}</span>
    </div>

    <div v-if="loading && !projects.length" class="state">Загрузка…</div>
    <div v-else-if="!projects.length && !error" class="state muted">Нет проектов.</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Клиент</th>
            <th>Статус</th>
            <th>Локация</th>
            <th>Создан</th>
            <th class="actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in projects" :key="p.id" @click="open(p.id)" class="clickable">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>{{ store.clientName(p.client) }}</td>
            <td>{{ store.statusName(p.status) }}</td>
            <td>{{ p.full_location_name || '—' }}</td>
            <td>{{ p.created_at?.slice(0, 10) }}</td>
            <td class="actions"><button class="btn btn-ghost" @click.stop="open(p.id)">Открыть →</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #1f2937; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
.muted { color: #6b7280; font-size: 14px; }
.alert { padding: 10px 14px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.state { padding: 32px; text-align: center; }
.table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.table th { background: #f8fafc; font-weight: 600; color: #475569; }
.clickable { cursor: pointer; }
.clickable:hover { background: #f9fafb; }
.actions { white-space: nowrap; }
.btn { border: 1px solid transparent; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.btn-ghost { background: transparent; color: #334155; border-color: #cbd5e1; }
.btn-ghost:hover { background: #f1f5f9; }
</style>
