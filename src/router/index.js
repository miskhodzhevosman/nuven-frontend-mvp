import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import FinanceView from '@/views/FinanceView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import ProductsView from '@/views/ProductsView.vue'
import FactoryView from '@/views/FactoryView.vue'
import ProjectDetailsView from '@/views/ProjectDetailsView.vue'
import ClientPaymentsView from '@/views/ClientPaymentsView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/settings', component: SettingsView },
  { path: '/finance', component: FinanceView },
  { path: '/projects', component: ProjectsView, name: 'projects' },
  { path: '/products', component: ProductsView },
  { path: '/factory', component: FactoryView },
  {
    path: '/projects/:id',
    name: 'project-details',
    component: ProjectDetailsView
  },
  { path: '/client-payments', name: 'client-payments', component: ClientPaymentsView },
]

export default createRouter({
  history: createWebHistory(),
  routes
})