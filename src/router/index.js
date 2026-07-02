import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import FinanceView from '@/views/FinanceView.vue'
import ProjectsView from '@/views/ProjectsView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/settings', component: SettingsView },
  { path: '/finance', component: FinanceView },
  { path: '/projects', component: ProjectsView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})