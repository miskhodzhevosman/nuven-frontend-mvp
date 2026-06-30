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
import { ref, onMounted } from "vue";
import StatsCard from "@/components/StatsCard.vue";
import PnLTable from "@/components/Table.vue";
import { getTotalReport, getPnLReport } from "@/services/financeService";

const report = ref({
  revenue: 0,
  gross_profit: 0,
  net_profit: 0,
});

const pnlData = ref([]);

const loadReport = async () => {
  try {
    const [{ data: total }, { data: pnl }] = await Promise.all([
      getTotalReport(),
      getPnLReport(),
    ]);

    report.value = total;

    let id = 1;

    pnlData.value = [
      {
        id: id++,
        name: "Выручка",
        amount: pnl.revenue.amount,
        percent: `${pnl.revenue.percent}%`,
        indent: 0,
        class: "",
      },

      {
        id: id++,
        name: "СЕБЕСТОИМОСТЬ",
        amount: null,
        percent: "",
        indent: 0,
        class: "category",
        isCategory: true,
      },

      {
        id: id++,
        name: "Себестоимость товаров (фабрики)",
        amount: -pnl.cost.amount,
        percent: `${pnl.cost.percent}%`,
        indent: 20,
        class: "",
      },

      {
        id: id++,
        name: "Валовая прибыль",
        amount: pnl.gross_profit.amount,
        percent: `${pnl.gross_profit.percent}%`,
        indent: 0,
        class: "total",
      },

      {
        id: id++,
        name: "РАСХОДЫ",
        amount: null,
        percent: "",
        indent: 0,
        class: "category",
        isCategory: true,
      },

      ...pnl.expenses.map((expense) => ({
        id: id++,
        name: expense.name,
        amount: -expense.amount,
        percent: `${expense.percent}%`,
        indent: 20,
        class: "",
      })),

      {
        id: id++,
        name: "Итого расходов",
        amount: -pnl.total_expenses.amount,
        percent: `${pnl.total_expenses.percent}%`,
        indent: 0,
        class: "total",
      },

      {
        id: id++,
        name: "Чистая прибыль",
        amount: pnl.net_profit.amount,
        percent: `${pnl.net_profit.percent}%`,
        indent: 0,
        class: "grand-total",
      },
    ];
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadReport);
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