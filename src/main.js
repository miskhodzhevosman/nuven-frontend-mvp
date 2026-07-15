import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Подключаем стили PrimeVue (порядок важен)
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';

// Если используешь Tailwind/свои стили — подключай после темы, чтобы переопределить
import './styles/main.css'

import './assets/styles/variables.css'
import './assets/styles/utilities.css'


// Импортируем Chart.js для правильной работы
import { registerables } from 'chart.js';
import Chart from 'chart.js/auto';

// Driver.js
import { driver } from "driver.js";
import './styles/driver.css'  // Локальная копия стилей


// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

const app = createApp(App)
const pinia = createPinia()

app.config.globalProperties.$driver = driver
app.use(pinia)
app.use(router)

// Инициализируем PrimeVue (опциональные настройки)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.p-dark' // Опционально: для настройки темной темы
        }
    }
});

app.mount('#app')