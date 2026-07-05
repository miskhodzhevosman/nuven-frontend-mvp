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
  background: rgba(14, 15, 18, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 420px;
  background: #16181C;
  border: 1px solid rgba(201, 168, 106, 0.15);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

.title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #D0D2D5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field span {
  font-size: 12px;
  color: #C9A86A;
}

input {
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  border-radius: 8px;
  background: #0E0F12;
  border: 1px solid rgba(201, 168, 106, 0.25);
  color: #D0D2D5;
  outline: none;
  transition: 0.15s;
}

input:focus {
  border-color: #C9A86A;
  box-shadow: 0 0 0 3px rgba(201, 168, 106, 0.12);
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
  background: #C9A86A;
  color: #0E0F12;
}

.primary:hover {
  filter: brightness(1.05);
}

.ghost {
  background: transparent;
  border: 1px solid rgba(201, 168, 106, 0.3);
  color: #D0D2D5;
}
</style>