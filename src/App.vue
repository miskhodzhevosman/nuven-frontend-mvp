<template>
  <router-view />
</template>

<style>
/*
 * ============================================
 * ГЛОБАЛЬНЫЕ СТИЛИ (main.css / global)
 * Цветовая схема: #16181C (фон), #C9A86A (золото), #D0D2D5 (текст)
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
  background: #16181C;
  color: #D0D2D5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: #C9A86A;
  text-decoration: none;
}

a:hover {
  color: #d4b87a;
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 106, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 106, 0.35);
}

/* ============================================
   ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
   ============================================ */
.text-center {
  text-align: center;
}

.text-gold {
  color: #C9A86A;
}

.text-muted {
  color: rgba(208, 210, 213, 0.5);
}

.text-positive {
  color: #4ade80;
}

.text-negative {
  color: #f87171;
}

.bg-gold {
  background: #C9A86A;
  color: #16181C;
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