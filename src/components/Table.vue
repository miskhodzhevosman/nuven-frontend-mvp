<template>
  <div class="pnl-container">
    <div class="pnl-header">
      <h3 class="pnl-title">Отчёт о прибылях и убытках (P&L)</h3>
      <span class="pnl-period">за 12 месяцев</span>
    </div>

    <table class="pnl-table">
      <thead>
        <tr>
          <th class="col-name">ДОХОДЫ</th>
          <th class="col-amount">СУММА</th>
          <th class="col-percent">% ВЫРУЧКИ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in formattedRows" :key="row.id" :class="row.class">
          <td class="col-name" :style="{ paddingLeft: row.indent + 'px' }">
            <span v-if="row.isCategory" class="category-label">{{ row.name }}</span>
            <span v-else>{{ row.name }}</span>
          </td>
          <td class="col-amount" :class="{ 'text-red': row.amount < 0 }">
            {{ formatAmount(row.amount) }}
          </td>
          <td class="col-percent">{{ row.percent }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'PnLTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    period: {
      type: String,
      default: 'за 12 месяцев'
    }
  },
  computed: {
  formattedRows() {
    return this.data;
  }
},
  methods: {
   
    formatAmount(amount) {
      if (amount === null || amount === undefined) return '—'
      const formatted = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(amount))
      return amount < 0 ? `–${formatted}` : formatted
    }
  }
}
</script>

<style scoped>
.pnl-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 24px;
  overflow-x: auto;
}

.pnl-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.pnl-title {
  font-size: 18px;
  font-weight: 500;
  color: #f3f4f6;
  margin: 0;
}

.pnl-period {
  font-size: 14px;
  color: #6b7280;
}

.pnl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.pnl-table thead th {
  text-align: left;
  padding: 8px 12px 8px 0;
  color: #6b7280;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pnl-table tbody td {
  padding: 8px 12px 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #d1d5db;
}

.pnl-table tbody tr:last-child td {
  border-bottom: none;
}

.pnl-table tbody tr.category td {
  padding-top: 16px;
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pnl-table tbody tr.category td.col-name {
  color: #6b7280;
}

.pnl-table tbody tr.total td {
  font-weight: 600;
  color: #f3f4f6;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pnl-table tbody tr.total td.col-name {
  color: #f3f4f6;
}

.pnl-table tbody tr.grand-total td {
  font-weight: 700;
  color: #f3f4f6;
  font-size: 15px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.pnl-table tbody tr.grand-total td.col-name {
  color: #f3f4f6;
}

.col-name {
  width: 45%;
}

.col-amount {
  width: 30%;
  text-align: right;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
}

.col-percent {
  width: 25%;
  text-align: right;
  color: #6b7280;
}

.text-red {
  color: #f87171 !important;
}

.category-label {
  color: #6b7280;
}

/* Адаптив */
@media (max-width: 640px) {
  .pnl-container {
    padding: 16px;
  }
  
  .pnl-title {
    font-size: 16px;
  }
  
  .pnl-table {
    font-size: 13px;
  }
  
  .col-name {
    width: 40%;
  }
  
  .col-amount {
    width: 35%;
  }
  
  .col-percent {
    width: 25%;
  }
}
</style>