import { driver } from "driver.js";
import "driver.js/dist/driver.css"

export const onboarding = driver({
    showProgress: true,
    animate: true,
    steps: [
        {
            element: "#kpi-cards",
            popover: {
                title: 'Карточки с основными показателями',
                description: 'Тут отчеты о движении денег и т.д.',
                side: 'right',
            },
        },
        {
            element: "#revenue-card",
            popover: {
                title: 'Выручка',
                description: 'Сумма оплат клиентов (как фактических, так и будущих)',
                side: 'right',
            },
        },
        {
            element: "#cost-price-card",
            popover: {
                title: 'Себестоимость',
                description: 'Сумма того, во сколько нам обошлись все товары во всех проектах',
                side: 'right',
            },
        },
        {
            element: "#gross-profit-card",
            popover: {
                title: 'Валовая прибыль',
                description: 'Разница между выручкой и себестоимостью',
                side: 'right',
            },
        },
        {
            element: "#net-profit-card",
            popover: {
                title: 'Чистая прибыль',
                description: 'Выручка минус расходы',
                side: 'right',
            },
        },
    ]
})