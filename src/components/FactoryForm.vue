<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="card">
      <h2 class="title">
        {{ factory?.id ? 'Редактирование' : 'Новая фабрика' }}
      </h2>

      <div class="form">
        <label class="field">
          <span>Название *</span>
          <input v-model="local.name" />
        </label>

        <label class="field">
          <span>Адрес</span>
          <input v-model="local.address" />
        </label>
      </div>

      <div class="actions">
        <button class="btn primary" @click="submit">Сохранить</button>
        <button class="btn ghost" @click="$emit('close')">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  factory: Object
})

const emit = defineEmits(['save', 'close'])

const local = reactive({
  id: null,
  name: '',
  address: ''
})

watch(
  () => props.factory,
  (val) => {
    local.id = val?.id ?? null
    local.name = val?.name ?? ''
    local.address = val?.address ?? ''
  },
  { immediate: true }
)

function submit() {
  if (!local.name.trim()) return

  emit('save', {
    id: local.id,
    name: local.name,
    address: local.address
  })
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 420px;
  background: #1c1c1c;
  border: 1px solid #2b2b2b;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

.title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #eaeaea;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field span {
  font-size: 12px;
  color: #aaa;
}

input {
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  border-radius: 8px;
  background: #121212;
  border: 1px solid #333;
  color: #fff;
  outline: none;
  transition: 0.15s;
}

input:focus {
  border-color: #3b82f6;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.primary {
  background: #3b82f6;
  color: white;
}

.ghost {
  background: transparent;
  border: 1px solid #333;
  color: #ddd;
}
</style>