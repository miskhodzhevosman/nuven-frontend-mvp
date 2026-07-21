<template>
  <div class="onboarding-menu-container">
    <!-- Плавающая кнопка -->
    <button
      class="onboarding-toggle-btn"
      @click="toggleMenu"
      title="Инструкции"
    >
      <!-- Огненное свечение -->
      <span class="fire-ring"></span>
      <span class="fire-ring delay-1"></span>
      <span class="fire-ring delay-2"></span>
      
      <!-- Иконка -->
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>

    <!-- Меню с кнопками -->
    <div v-if="showMenu" class="onboarding-menu">
      <div class="menu-header">
        <h3>📚 Инструкции</h3>
        <button class="close-btn" @click="closeMenu">✕</button>
      </div>
      <div class="menu-body">
        <slot />
      </div>
    </div>

    <!-- Оверлей (простое затемнение без блюра) -->
    
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}
</script>

<style scoped>
.onboarding-menu-container {
  position: fixed;
  bottom: 30px;
  left: 30px;
  z-index: 9999;
}

/* ===== Кнопка ===== */
.onboarding-toggle-btn {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #16181C;
  border: 2px solid #C9A86A;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C9A86A;
  transition: all 0.3s ease;
  box-shadow: 
    0 0 20px rgba(201, 168, 106, 0.3),
    inset 0 0 20px rgba(201, 168, 106, 0.1);
}

.onboarding-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 
    0 0 30px rgba(201, 168, 106, 0.5),
    inset 0 0 30px rgba(201, 168, 106, 0.2);
}

.onboarding-toggle-btn svg {
  position: relative;
  z-index: 2;
}

/* ===== Огненные кольца ===== */
.fire-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: firePulse 2s ease-out infinite;
  pointer-events: none;
}

.fire-ring::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    #C9A86A 20%,
    #FF6B35 40%,
    #FF4500 60%,
    #FF6B35 80%,
    #C9A86A 100%
  );
  animation: fireRotate 3s linear infinite;
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #fff calc(100% - 2px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #fff calc(100% - 2px));
}

.fire-ring.delay-1 {
  animation-delay: 0.5s;
}

.fire-ring.delay-2 {
  animation-delay: 1s;
}

.fire-ring.delay-1::before {
  animation-delay: 0.5s;
}

.fire-ring.delay-2::before {
  animation-delay: 1s;
}

/* ===== Анимации ===== */
@keyframes firePulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

@keyframes fireRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* ===== Меню ===== */


.onboarding-menu {
  position: absolute;
  bottom: 75px;
  left: 0;
  min-width: 280px;
  background: #16181C;
  border: 1px solid #C9A86A;
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(201, 168, 106, 0.1);
  z-index: 9999;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(201, 168, 106, 0.2);
  background: rgba(201, 168, 106, 0.05);
}

.menu-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #C9A86A;
  letter-spacing: 0.5px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(201, 168, 106, 0.6);
  padding: 0 4px;
  transition: all 0.2s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  color: #C9A86A;
  background: rgba(201, 168, 106, 0.1);
}

.menu-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== Стили для кнопок внутри слота ===== */
.menu-body :deep(.menu-btn) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(201, 168, 106, 0.15);
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #e0e0e0;
  transition: all 0.3s ease;
  width: 100%;
  text-align: left;
}

.menu-body :deep(.menu-btn:hover) {
  background: rgba(201, 168, 106, 0.08);
  border-color: rgba(201, 168, 106, 0.3);
  transform: translateX(4px);
  color: #C9A86A;
}

.menu-body :deep(.menu-btn:active) {
  transform: scale(0.98);
}

.menu-body :deep(.menu-btn .icon) {
  font-size: 20px;
}

/* ===== Анимации ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>