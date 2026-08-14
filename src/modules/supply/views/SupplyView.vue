<!-- src/modules/supply/views/SupplyView.vue -->
<template>
  <div class="supply-view">
    <div class="supply-view__header">
      <h1 class="supply-view__title">Управление поставками</h1>
    </div>

    <div class="supply-view__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="supply-view__tab"
        :class="{ 'supply-view__tab--active': activeTab === tab.key }"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="supply-view__content">
      <div v-if="activeTab === 'factories'">
        <FactoryList />
      </div>
      <div v-else-if="activeTab === 'nomenclatures'">
        <div class="supply-view__placeholder">
          <p>Страница номенклатур в разработке</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FactoryList from '@/modules/supply/components/FactoryList.vue'

const tabs = [
  { key: 'factories', label: 'Фабрики' },
  { key: 'nomenclatures', label: 'Номенклатуры' },
]

const activeTab = ref('factories')
</script>

<style scoped>
.supply-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.supply-view__header {
  margin-bottom: 24px;
}

.supply-view__title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.supply-view__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.supply-view__tab {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.supply-view__tab:hover {
  color: #1890ff;
}

.supply-view__tab--active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}

.supply-view__placeholder {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.supply-view__placeholder p {
  color: #999;
  font-size: 16px;
}
</style>