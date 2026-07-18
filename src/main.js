// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'  // ← ДОБАВЬТЕ импорт роутера

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)       // ← Сначала Pinia
app.use(router)      // ← Затем роутер
app.mount('#app')