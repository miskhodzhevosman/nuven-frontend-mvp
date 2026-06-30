import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import UsersView from '@/views/UsersView.vue'
import SettingsView from '@/views/SettingsView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/users', component: UsersView },
  { path: '/settings', component: SettingsView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})