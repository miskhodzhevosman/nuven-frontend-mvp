<template>
  <div class="crm-view">
    <h1>CRM Projects</h1>

    <StatusTags
      :tags="statusTags"
      :activeStatusId="activeStatusId"
      :totalCount="projects.length"
      @select="setFilter"
    />

    <ProjectTable
      :projects="projects"
      :activeStatusId="activeStatusId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { crmService } from "@/services/crmService";

import StatusTags from "@/components/StatusTags.vue";
import ProjectTable from "@/components/ProjectTable.vue";

const projects = ref([]);
const statuses = ref([]);
const activeStatusId = ref(null);

async function loadData() {
  const [p, s] = await Promise.all([
    crmService.getProjects(),
    crmService.getStatuses(),
  ]);

  projects.value = p;
  statuses.value = s;
}

const statusTags = computed(() => {
  return statuses.value
    .map((status) => {
      const count = projects.value.filter(
        (p) => p.status === status.id
      ).length;

      return {
        id: status.id,
        name: status.name,
        count,
      };
    })
    .sort((a, b) => a.order - b.order);
});

function setFilter(id) {
  activeStatusId.value = id;
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.crm-view {
  padding: 20px;
}
</style>