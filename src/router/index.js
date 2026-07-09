// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const Login = () => import('@/views/Login.vue');
const DashboardLayout = () => import('@/layouts/DashboardLayout.vue');
const HomeView = () => import('@/views/HomeView.vue');
const FactotyView = () => import('@/views/FactoriesView.vue')


const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      name: 'login', 
      component: Login, 
      meta: { public: true } 
    },
    {
      path: '/',
      component: DashboardLayout,
      children: [
        { 
          path: '', 
          name: 'home', 
          component: HomeView 
        },
        {
            path: 'factory',
            name: 'factory',
            component: () => import('@/views/FactoriesView.vue')
        },
        {
            path: 'projects',
            name: 'projects',
            component: () => import('@/views/ProjectsView.vue')
        },
        {
  path: 'projects/:id',
  name: 'project-details',
  component: () => import('@/views/ProjectDetailsView.vue')
}
        // 👇 Добавляй свои страницы сюда:
        // { 
        //   path: 'analytics', 
        //   name: 'analytics', 
        //   component: () => import('@/views/Analytics.vue') 
        // },
        // { 
        //   path: 'settings', 
        //   name: 'settings', 
        //   component: () => import('@/views/Settings.vue') 
        // },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to) => {
  const { state, initAuth, isAuthenticated } = useAuth();
  if (!state.ready) await initAuth();
  if (!to.meta.public && !isAuthenticated.value) {
    return { name: 'login', query: { next: to.fullPath } };
  }
  if (to.name === 'login' && isAuthenticated.value) {
    return { path: to.query.next || '/' };
  }
});

export default router;