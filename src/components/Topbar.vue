<template>
  <header class="topbar">

    <!-- LEFT -->
    <div class="topbar-left">

      <!-- Burger -->
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <svg viewBox="0 0 24 24">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div>
        <div class="topbar-title">Дашборд</div>
        <div class="topbar-breadcrumb">
          <span>NUVEN</span> / Обзор / Дашборд
        </div>
      </div>

    </div>

    <!-- RIGHT -->
    <div class="topbar-right">

      <!-- Search -->
      <div class="search-box">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Поиск..." />
      </div>

      <!-- Notifications -->
      <div class="topbar-icon">
        <svg viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span class="badge">3</span>
      </div>

      <!-- Help -->
      <div class="topbar-icon">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <!-- Avatar -->
      <div class="avatar">
        JD
      </div>

    </div>

  </header>
</template>

<script setup>
defineEmits(['toggle-sidebar'])
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #0f131a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* LEFT */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  background: none;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  display: none;
}

.menu-toggle svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
}

.topbar-title {
  font-size: 18px;
  font-weight: 500;
  color: #f3f4f6;
}

.topbar-breadcrumb {
  font-size: 14px;
  color: #6b7280;
}

.topbar-breadcrumb span {
  color: #9ca3af;
}

/* RIGHT */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* SEARCH */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-box input {
  background: none;
  border: none;
  outline: none;
  color: #d1d5db;
  width: 180px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  stroke: #6b7280;
  fill: none;
  stroke-width: 2;
}

/* ICONS */
.topbar-icon {
  position: relative;
  color: #9ca3af;
  cursor: pointer;
}

.topbar-icon:hover {
  color: #f3f4f6;
}

.topbar-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* AVATAR */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .search-box {
    display: none;
  }

  .topbar {
    padding: 12px 16px;
  }
}
</style>