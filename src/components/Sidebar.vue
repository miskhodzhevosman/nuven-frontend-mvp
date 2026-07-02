<template>
  <aside class="sidebar">
    <!-- LOGO -->
    <div class="logo">
      <div class="logo-icon">N</div>
      <span class="logo-text">NUVEN</span>
    </div>

    <!-- NAV -->
    <nav class="nav">

      <div class="nav-category">ОБЗОР</div>

      <router-link to="/" class="nav-item">
        <span class="nav-item-left">
          <DashboardIcon />
          Дашборд
        </span>
      </router-link>

      <router-link to="/analytics" class="nav-item">
        <span class="nav-item-left">
          <AnalyticsIcon />
          Аналитика
        </span>
      </router-link>

      <router-link to="/finance" class="nav-item">
        <span class="nav-item-left">
          <FinanceIcon />
          Финансы и P&L
        </span>
      </router-link>

      <div class="nav-category">КЛИЕНТЫ И ПРОДАЖИ</div>

      <router-link to="/crm" class="nav-item">
        <span class="nav-item-left">
          <CrmIcon />
          CRM / Лиды
        </span>
      </router-link>

      <router-link to="/clients" class="nav-item">
        <span class="nav-item-left">
          <ClientsIcon />
          Клиенты
        </span>
      </router-link>

      <router-link to="/projects" class="nav-item">
        <span class="nav-item-left">
          <ProjectsIcon />
          Проекты
        </span>
      </router-link>

      <div class="nav-category">ФИНАНСЫ</div>

      <router-link to="/payments" class="nav-item">
        <span class="nav-item-left">
          <PaymentsIcon />
          Оплаты
        </span>
      </router-link>

      <router-link to="/expenses" class="nav-item">
        <span class="nav-item-left">
          <ExpensesIcon />
          Расходы
        </span>
      </router-link>

      <div class="nav-category">СИСТЕМА</div>

      <router-link to="/settings" class="nav-item">
        <span class="nav-item-left">
          <SettingsIcon />
          Настройки
        </span>
      </router-link>

    </nav>

    <!-- FOOTER -->
    <div class="footer">
      <span class="status-dot"></span>
      Система работает
    </div>
  </aside>
</template>

<script setup>
// Заглушки иконок (потом можно заменить на Heroicons / Lucide)
const DashboardIcon = {
  template: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`
}

const AnalyticsIcon = {
  template: `<svg viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`
}

const FinanceIcon = {
  template: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`
}

const CrmIcon = { template: `<svg viewBox="0 0 24 24"><path d="M17 21v-2"/></svg>` }
const ClientsIcon = { template: `<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/></svg>` }
const ProjectsIcon = { template: `<svg viewBox="0 0 24 24"><path d="M22 19V5"/></svg>` }
const PaymentsIcon = { template: `<svg viewBox="0 0 24 24"><rect width="20" height="12"/></svg>` }
const ExpensesIcon = { template: `<svg viewBox="0 0 24 24"><path d="M14 2H6"/></svg>` }
const SettingsIcon = { template: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>` }
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: #16181C;
  color: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: bold;
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.nav-category {
  font-size: 11px;
  color: #6b7280;
  padding: 10px 20px;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  padding: 10px 20px;
  color: #d1d5db;
  text-decoration: none;
  border-radius: 8px;
  margin: 2px 10px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: white;
}

.nav-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item-left svg {
  width: 18px;
  height: 18px;
  stroke: #6b7280;
  fill: none;
}

.footer {
  padding: 14px 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #34d399;
  border-radius: 50%;
}
</style>