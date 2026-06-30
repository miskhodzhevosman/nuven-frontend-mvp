<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>

    <div class="stat-value">
      {{ formattedValue }}
    </div>

    <div v-if="showTrend" class="stat-change" :class="trendClass">
      {{ trendIcon }} {{ changeText }}
    </div>
  </div>
</template>

<script>
export default {
  name: "StatCard",

  props: {
    // Название карточки
    label: {
      type: String,
      default: "Метрика",
    },

    // Числовое значение из API (revenue / gross_profit / net_profit)
    value: {
      type: Number,
      default: 0,
    },

    // Показывать ли блок изменения (опционально)
    showTrend: {
      type: Boolean,
      default: false,
    },

    // Изменение (если нужно сравнение с прошлым периодом)
    change: {
      type: String,
      default: "",
    },

    // Период (например "за месяц")
    period: {
      type: String,
      default: "",
    },

    // up / down
    trend: {
      type: String,
      default: "up",
      validator: (v) => ["up", "down"].includes(v),
    },
  },

  computed: {
    formattedValue() {
      if (this.value === null || this.value === undefined) return "—";

      return new Intl.NumberFormat("ru-RU").format(this.value) + " $";
    },

    changeText() {
      return `${this.change} ${this.period}`.trim();
    },

    trendClass() {
      return this.trend === "up" ? "trend-up" : "trend-down";
    },

    trendIcon() {
      return this.trend === "up" ? "▲" : "▼";
    },
  },
};
</script>

<style scoped>
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px 24px;
  transition: all 0.2s ease;
  min-width: 200px;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.stat-change {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #34d399;
}

.trend-down {
  color: #f87171;
}
</style>