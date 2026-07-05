import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import FinanceView from '@/views/FinanceView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import ProductsView from '@/views/ProductsView.vue'
import FactoryView from '@/views/FactoryView.vue'
import ProjectDetailsView from '@/views/ProjectDetailsView.vue'
import ClientPaymentsView from '@/views/ClientPaymentsView.vue'
import FactoryPaymentsView from '@/views/FactoryPaymentsView.vue'
import OperationExpensesView from '@/views/OperationExpensesView.vue'

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
  { path: '/factory-payments', name: 'factory-payments', component: FactoryPaymentsView },
  { path: '/expenses', name: 'expenses', component: OperationExpensesView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})