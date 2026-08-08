<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Введите для поиска'
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  minChars: {
    type: Number,
    default: 2
  },
  displayField: {
    type: String,
    default: 'name'
  },
  id: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'input', 'select', 'blur', 'focus'])

const showSuggestions = ref(false)
const selectedItem = ref(null)
const localValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

function onInput() {
  emit('update:modelValue', localValue.value)
  emit('input')
  if (localValue.value.length >= props.minChars) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

function onFocus() {
  if (localValue.value.length >= props.minChars) {
    showSuggestions.value = true
  }
  emit('focus')
}

function onBlur() {
  setTimeout(() => {
    showSuggestions.value = false
    emit('blur')
  }, 200)
}

function selectItem(item) {
  selectedItem.value = item
  localValue.value = item[props.displayField] || item.name || item.full_name
  emit('update:modelValue', localValue.value)
  emit('select', item)
  showSuggestions.value = false
}
</script>

<template>
  <div class="combobox-wrapper">
    <input
      :value="localValue"
      type="text"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      autocomplete="off"
      :id="id"
    />
    <div v-if="loading" class="combobox-loading">⏳</div>
    <ul v-if="showSuggestions && suggestions.length > 0" class="combobox-suggestions">
      <li 
        v-for="item in suggestions" 
        :key="item.id"
        @mousedown.prevent="selectItem(item)"
      >
        {{ item[displayField] || item.name || item.full_name }}
      </li>
    </ul>
  </div>
</template>