<template>
  <div>
    <div class="stats-grid">
      <StatsCard
        label="Выручка"
        :value="report.revenue"
      />

      <StatsCard
        label="Валовая прибыль"
        :value="report.gross_profit"
      />

      <StatsCard
        label="Чистая прибыль"
        :value="report.net_profit"
      />
    </div>

    <div>
      <PnLTable :data="pnlData" />
    </div>
  </div>
</template>

<script setup>

</script>
<style>
.stats-grid {
  display: flex;
  gap: 10px;
}
</style>

<style>
.cards {
  display: flex;
  gap: 10px;
}
h1 {color: #f3f4f6;}
</style>