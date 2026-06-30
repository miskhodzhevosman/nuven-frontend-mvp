<template>
  <div class="layout">
    <Sidebar />

    <div class="main">
      <Topbar />

      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
</script>

<style>
.layout { display: flex; height: 100vh; }
.main { flex: 1; display: flex; flex-direction: column; }
.content { padding: 20px; }
html { background: #0E0F12; }
</style>