import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

// Важно: массив должен быть определен явно
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: DashboardLayout,
    redirect: '/supply',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'main',
        name: 'dashboard',
        component: () => import('@/Dashboard.vue'),
        meta: { title: 'Поставки' }
      },
      {
        path: 'supply',
        name: 'supply',
        component: () => import('@/modules/supply/views/SupplyView.vue'),
        meta: { title: 'Поставки' }
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/modules/projects/views/ProjectsView.vue'),
        meta: { title: 'Проекты' }
      },
      {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('@/modules/projects/views/DetailView.vue'),
      props: true,
    },
      {
        path: 'finance',
        name: 'finance',
        component: () => import('@/modules/finance/views/FinanceView.vue'),
        meta: { title: 'Финансы' }
      },
      {
    path: '/users',
    name: 'Users',
    component: () => import('@/modules/users/views/UsersList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users/create',
    name: 'UserCreate',
    component: () => import('@/modules/users/views/UserCreate.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users/:id/edit',
    name: 'UserEdit',
    component: () => import('@/modules/users/views/UserEdit.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/modules/users/views/UserProfile.vue'),
    meta: { requiresAuth: true }
  }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes // <-- Убедись, что здесь именно этот массив
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresGuest && token) {
    next('/supply')
  } else {
    next()
  }
})

export default router