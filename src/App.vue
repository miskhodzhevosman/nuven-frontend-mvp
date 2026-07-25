<template>
  <router-view />
</template>

<style>
/*
 * ============================================
 * ГЛОБАЛЬНЫЕ СТИЛИ (main.css / global)
 * Цветовая схема: #F8F9FA (фон), #2C3E50 (акцент), #1A1A1A (текст)
 * ============================================
 */

/* ============================================
   RESET & BASE
   ============================================ */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  background: #F8F9FA;
  color: #1A1A1A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: #2C3E50;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #34495E;
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(44, 62, 80, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 62, 80, 0.25);
}

/* ============================================
   ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
   ============================================ */
.text-center {
  text-align: center;
}

.text-gold {
  color: #2C3E50;
}

.text-muted {
  color: rgba(26, 26, 26, 0.5);
}

.text-positive {
  color: #16A34A;
}

.text-negative {
  color: #DC2626;
}

.bg-gold {
  background: #2C3E50;
  color: #FFFFFF;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-8 {
  gap: 8px;
}

.gap-12 {
  gap: 12px;
}

.gap-16 {
  gap: 16px;
}

.mt-8 {
  margin-top: 8px;
}

.mt-16 {
  margin-top: 16px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-16 {
  margin-bottom: 16px;
}

/* ============================================
   АНИМАЦИИ
   ============================================ */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.fade-in {
  animation: fadeIn 0.25s ease forwards;
}

.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>