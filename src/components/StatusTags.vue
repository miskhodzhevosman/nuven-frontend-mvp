<template>
  <div class="status-tags">
    <button
      class="tag"
      :class="{ active: activeStatusId === null }"
      @click="$emit('select', null)"
    >
      Все: {{ totalCount }}
    </button>

    <button
      v-for="tag in tags"
      :key="tag.id"
      class="tag"
      :class="{ active: activeStatusId === tag.id }"
      @click="$emit('select', tag.id)"
    >
      {{ tag.name }}: {{ tag.count }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  activeStatusId: {
    type: [Number, null],
    default: null,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(["select"]);
</script>

<style scoped>
.status-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tag {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.tag.active {
  background: #2d6cdf;
  color: white;
  border-color: #2d6cdf;
}
</style>