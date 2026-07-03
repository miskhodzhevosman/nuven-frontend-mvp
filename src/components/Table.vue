<template>
  <div class="table-wrapper">
    <table class="base-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">
            {{ col.label }}
          </th>
          <th v-if="$slots.actions">Действия</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
            Загрузка...
          </td>
        </tr>

        <tr
          v-else-if="rows.length"
          v-for="row in rows"
          :key="row[rowKey]"
        >
          <td v-for="col in columns" :key="col.key">
            <!-- Если есть слот под конкретную колонку -->
            <slot
              :name="`cell-${col.key}`"
              :value="row[col.key]"
              :row="row"
            >
              {{ row[col.key] }}
            </slot>
          </td>

          <td v-if="$slots.actions">
            <slot name="actions" :row="row" />
          </td>
        </tr>

        <tr v-else>
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
            Нет данных
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  rowKey: {
    type: String,
    default: 'id'
  }
})
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #2d2d3f;
  background-color: #1a1a2e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
  color: #e2e8f0;
  min-width: 700px;
}

.base-table thead {
  background-color: #252540;
}

.base-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 2px solid #2d2d3f;
  border-top: none;
  border-left: none;
  border-right: none;
  white-space: nowrap;
}

.base-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #2d2d3f;
  border-left: none;
  border-right: none;
  border-top: none;
  color: #e2e8f0;
  background-color: #1a1a2e;
}

.base-table tbody tr {
  transition: background-color 0.15s ease;
}

.base-table tbody tr:hover {
  background-color: #22223a;
}

.base-table tbody tr:last-child td {
  border-bottom: none;
}

@media (max-width: 768px) {
  .base-table {
    font-size: 13px;
    min-width: 600px;
  }

  .base-table th,
  .base-table td {
    padding: 10px 12px;
  }
}
</style>