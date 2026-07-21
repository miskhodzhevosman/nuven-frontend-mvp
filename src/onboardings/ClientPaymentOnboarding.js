// onboardings/ClientPaymentOnboarding.js
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const onboarding = driver({
    showProgress: true,
    animate: true,
    steps: [
        {
            element: "#add-client-payment-btn",
            popover: {
                title: 'Добавить оплату клиента',
                description: 'Нажмите для добавления оплаты от клиента',
                side: 'left',
            },
        },
        {
            element: "#payment-amount-field",
            popover: {
                title: 'Сумма оплаты',
                description: 'Введите сумму оплаты от клиента',
                side: 'right',
            },
        },
        {
            element: "#payment-date-field",
            popover: {
                title: 'Дата оплаты',
                description: 'Выберите дату оплаты',
                side: 'right',
            },
        },
        {
            element: "#payment-counterparty-field",
            popover: {
                title: 'Контрагент',
                description: 'Выберите клиента-плательщика',
                side: 'right',
            },
        },
        {
            element: "#payment-comment-field",
            popover: {
                title: 'Комментарий',
                description: 'Добавьте комментарий (опционально)',
                side: 'right',
            },
        },
        {
            element: "#payment-save-btn",
            popover: {
                title: 'Сохранить оплату',
                description: 'Нажмите для сохранения оплаты',
                side: 'right',
            },
        },
    ]
});

export function nextOnboardingStep() {
    if (onboarding.isActive()) {
        onboarding.moveNext();
    }
}

export function completeOnboarding() {
    if (onboarding.isActive()) {
        onboarding.destroy();
    }
}