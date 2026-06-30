<template>
  <div>
    <h1>Dashboard</h1>

    <div class="cards">
      <StatsCard title="Users" :value="120" />
      <StatsCard title="Revenue" :value="5400" />
      <StatsCard title="Orders" :value="32" />
    </div>
  </div>
</template>

<script setup>
import StatsCard from '@/components/StatsCard.vue'
</script>

<style>
.cards {
  display: flex;
  gap: 10px;
}
</style>