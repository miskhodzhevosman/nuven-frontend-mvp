// onboardings/ProjectExpenseOnboarding.js
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const onboarding = driver({
    showProgress: true,
    animate: true,
    steps: [
        {
            element: "#add-expense-btn",
            popover: {
                title: 'Добавить расход',
                description: 'Нажмите для добавления нового расхода',
                side: 'left',
            },
        },
        {
            element: "#expense-amount-field",
            popover: {
                title: 'Сумма расхода',
                description: 'Введите сумму расхода',
                side: 'right',
            },
        },
        {
            element: "#expense-date-field",
            popover: {
                title: 'Дата расхода',
                description: 'Выберите дату расхода',
                side: 'right',
            },
        },
        {
            element: "#expense-type-field",
            popover: {
                title: 'Тип расхода',
                description: 'Введите или выберите тип расхода',
                side: 'right',
            },
        },
        {
            element: "#expense-counterparty-field",
            popover: {
                title: 'Контрагент',
                description: 'Выберите контрагента (опционально)',
                side: 'right',
            },
        },
        {
            element: "#expense-comment-field",
            popover: {
                title: 'Комментарий',
                description: 'Добавьте комментарий (опционально)',
                side: 'right',
            },
        },
        {
            element: "#expense-save-btn",
            popover: {
                title: 'Сохранить расход',
                description: 'Нажмите для сохранения расхода',
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