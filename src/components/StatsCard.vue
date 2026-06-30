<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: Number
})
</script>

<style>
.card {
  padding: 10px;
  background: white;
  border: 1px solid #ccc;
  flex: 1;
}
</style>