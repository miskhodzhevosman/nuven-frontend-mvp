<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Клиент</th>
          <th>Тех. менеджер</th>
          <th>География</th>
          <th>Статус</th>
          <th>Дата создания</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in filteredProjects" :key="project.id">
          <td>{{ project.id }}</td>
          <td>{{ project.name }}</td>
          <td>{{ project.client_name }}</td>
          <td>{{ project.tech_manager_name }}</td>
          <td>{{ project.geography }}</td>
          <td>{{ project.status_name }}</td>
          <td>{{ formatDate(project.created_at) }}</td>
        </tr>

        <tr v-if="filteredProjects.length === 0">
          <td colspan="7" style="text-align:center; padding:12px;">
            Нет проектов
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  projects: {
    type: Array,
    default: () => [],
  },
  activeStatusId: {
    type: [Number, null],
    default: null,
  },
});

const filteredProjects = computed(() => {
  if (props.activeStatusId === null) return props.projects;
  return props.projects.filter(
    (p) => p.status === props.activeStatusId
  );
});

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
}
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border-bottom: 1px solid #eee;
  padding: 10px;
  text-align: left;
  color: #fff;
}

th {
  background: #0f0f0f;
}
</style>