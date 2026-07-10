// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { getAccessToken } from '@/api/http';

// Ленивая загрузка компонентов
const Login = () => import('@/views/Login.vue');
const DashboardLayout = () => import('@/layouts/DashboardLayout.vue');
const HomeView = () => import('@/views/HomeView.vue');
const FactoriesView = () => import('@/views/FactoriesView.vue');
const ProjectsView = () => import('@/views/ProjectsView.vue');
const ProjectDetailsView = () => import('@/views/ProjectDetailsView.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      name: 'login', 
      component: Login, 
      meta: { public: true } // Доступ без авторизации
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true }, // Все дочерние пути требуют авторизации
      children: [
        { 
          path: '', 
          name: 'home', 
          component: HomeView 
        },
        {
          path: 'factory',
          name: 'factory',
          component: FactoriesView
        },
        {
          path: 'projects',
          name: 'projects',
          component: ProjectsView
        },
        {
          path: 'projects/:id',
          name: 'project-details',
          component: ProjectDetailsView
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
    // 404 - перенаправление на главную
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// ============================================
// Глобальный guards (навигационные хуки)
// ============================================

router.beforeEach(async (to, from, next) => {
  const { state, initAuth, isAuthenticated } = useAuth();
  
  // 1. Инициализация аутентификации, если еще не готова
  if (!state.ready) {
    await initAuth();
  }
  
  // 2. Проверка на публичные страницы (login, register и т.д.)
  const isPublic = to.meta.public === true;
  
  // 3. Проверка аутентификации
  const token = getAccessToken();
  const isAuth = isAuthenticated.value && !!token;
  
  // 4. Если страница требует авторизации, а пользователь не авторизован
  if (!isPublic && !isAuth) {
    // Сохраняем путь для редиректа после логина
    return next({ 
      name: 'login', 
      query: { next: to.fullPath } 
    });
  }
  
  // 5. Если пользователь авторизован и пытается зайти на страницу логина
  if (to.name === 'login' && isAuth) {
    // Редиректим на главную или на сохраненный путь
    const redirectPath = to.query.next || '/';
    return next(redirectPath);
  }
  
  // 6. Все остальные случаи - пропускаем
  next();
});

// ============================================
// После каждого перехода (для аналитики и т.д.)
// ============================================

router.afterEach((to, from) => {
  // Закрываем мобильное меню, скроллим наверх и т.д.
  // console.log(`Navigated from ${from.path} to ${to.path}`);
  
  // Пример: отправка в Google Analytics
  // if (window.gtag) {
  //   window.gtag('config', 'GA_MEASUREMENT_ID', {
  //     page_path: to.fullPath,
  //   });
  // }
});

export default router;