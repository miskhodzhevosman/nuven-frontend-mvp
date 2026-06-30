import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import FinanceView from '@/views/FinanceView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/settings', component: SettingsView },
  { path: '/finance', component: FinanceView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})