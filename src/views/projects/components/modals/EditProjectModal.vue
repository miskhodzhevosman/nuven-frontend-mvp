<template>
  <Dialog
    v-model:visible="isVisible"
    header="Редактирование проекта"
    :modal="true"
    :style="{ width: '500px' }"
    class="p-fluid"
    @hide="$emit('update:visible', false)"
  >
    <form @submit.prevent="saveProject">
      <div class="field">
        <label for="project-name">Название</label>
        <InputText id="project-name" v-model="form.name" />
      </div>

      <div class="field">
        <label for="project-location">География (Город)</label>
        <AutoComplete
          id="project-location"
          v-model="selectedLocation"
          :suggestions="store.locations"
          @complete="handleLocationSearch"
          field="full_path"
          placeholder="Начните вводить город..."
          dropdown
          forceSelection
          optionLabel="full_path"
          optionValue="id"
        >
          <template #option="slotProps">
            <div class="flex flex-col">
              <span class="font-bold">{{ slotProps.option.name }}</span>
              <small class="text-muted">{{ slotProps.option.full_path }}</small>
            </div>
          </template>
        </AutoComplete>
      </div>

      <div class="field">
        <label for="project-client">Клиент</label>
        <Select 
          id="project-client"
          v-model="form.client"
          :options="clients"
          optionLabel="name"
          optionValue="id"
          placeholder="Выберите клиента"
        />
      </div>

      <div class="field">
        <label for="project-manager">Менеджер</label>
        <Select 
          id="project-manager"
          v-model="form.tech_manager"
          :options="managers"
          optionLabel="full_name"
          optionValue="id"
          placeholder="Выберите менеджера"
        />
      </div>

      <div class="field">
        <label for="project-status">Статус</label>
        <Select 
          id="project-status"
          v-model="form.status"
          :options="statuses"
          optionLabel="name"
          optionValue="id"
          placeholder="Выберите статус"
        />
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="$emit('update:visible', false)" class="p-button-text" />
        <Button label="Сохранить" icon="pi pi-check" type="submit" :loading="store.saving" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

const props = defineProps({
  visible: Boolean,
  project: Object,
  projectInfo: Object,
  clients: Array,
  managers: Array,
  statuses: Array,
  store: Object
})

const emit = defineEmits(['update:visible', 'saved'])

const isVisible = ref(props.visible)
const selectedLocation = ref(null)

const form = reactive({
  name: '',
  location: null,
  client: null,
  tech_manager: null,
  status: null,
})

watch(() => props.visible, (val) => {
  isVisible.value = val
  if (val && props.project) {
    form.name = props.project.name ?? ''
    form.location = props.project.location ?? null
    form.client = props.project.client ?? null
    form.tech_manager = props.project.tech_manager ?? null
    form.status = props.project.status ?? null
    
    // Init Location Display
    if (props.project.location) {
       if (typeof props.project.location === 'object' && props.project.location.full_path) {
         selectedLocation.value = props.project.location
       } else {
         selectedLocation.value = {
           id: props.project.location,
           name: props.projectInfo?.full_location_name?.split(',')[0] || '',
           full_path: props.projectInfo?.full_location_name || ''
         }
       }
    } else {
      selectedLocation.value = null
    }
  }
})

watch(isVisible, (val) => emit('update:visible', val))

async function handleLocationSearch(event) {
  await props.store.searchLocations(event.query)
}

async function saveProject() {
  try {
    await props.store.updateProject(props.project.id, {
      name: form.name,
      location: selectedLocation.value ? selectedLocation.value.id : null,
      client: Number(form.client),
      tech_manager: Number(form.tech_manager),
      status: Number(form.status),
    })
    emit('saved')
    isVisible.value = false
  } catch (error) {
    console.error(error)
    alert('Ошибка сохранения')
  }
}
</script>