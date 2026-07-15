<template>
  <Card class="transactions-card">
    <template #title>
      <div class="card-header">
        <div>
          <h2 class="card-title">{{ title }}</h2>
          <p class="card-subtitle">{{ subtitle }}</p>
        </div>
        <Button 
          :label="addButtonLabel" 
          icon="pi pi-plus"
          @click="$emit('add')" 
        />
      </div>
    </template>
    <template #content>
      <div v-if="items.length" class="table-wrap">
        <DataTable 
          :value="items" 
          dataKey="id"
          class="p-datatable-sm"
          stripedRows
        >
          <!-- Динамическая генерация колонок -->
          <Column 
            v-for="col in columns" 
            :key="col.field"
            :field="col.field" 
            :header="col.header"
            :style="col.style"
          >
            <template #body="{ data }">
              <!-- Если есть кастомный рендерер, используем его, иначе просто выводим поле -->
              <span v-if="col.render" v-html="col.render(data)"></span>
              <span v-else>{{ data[col.field] }}</span>
            </template>
          </Column>
          
          <!-- Колонка действий -->
          <Column header="Действия" style="width: 100px">
            <template #body="{ data }">
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                @click="$emit('delete', data.id)"
                tooltip="Удалить"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="empty-state">
        <i :class="emptyIcon" style="font-size: 2rem; color: #9AA0A6;"></i>
        <h4>{{ emptyTitle }}</h4>
        <p>{{ emptyDescription }}</p>
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

defineProps({
  title: String,
  subtitle: String,
  addButtonLabel: String,
  items: Array,
  columns: Array, // <-- Новый пропс: массив конфигурации колонок
  emptyIcon: { type: String, default: 'pi pi-file' },
  emptyTitle: { type: String, default: 'Нет записей' },
  emptyDescription: { type: String, default: 'Добавьте первую запись' }
})

defineEmits(['add', 'delete'])
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem;
}
</style>