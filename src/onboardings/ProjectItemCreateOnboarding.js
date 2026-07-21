// onboardings/ProjectItemCreateOnboarding.js
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const onboarding = driver({
    showProgress: true,
    animate: true,
    steps: [
        {
            element: "#add-item-btn",
            popover: {
                title: 'Добавить позицию',
                description: 'Нажмите для добавления новой позиции в проект',
                side: 'left',
            },
        },
        {
            element: "#item-nomenclature-field",
            popover: {
                title: 'Выбор товара',
                description: 'Начните вводить название товара или выберите из списка',
                side: 'right',
            },
        },
        {
            element: "#item-create-nomenclature-btn",
            popover: {
                title: 'Создать новый товар',
                description: 'Если нужного товара нет в списке, создайте новый',
                side: 'right',
            },
        },
        {
            element: "#item-quantity-field",
            popover: {
                title: 'Количество',
                description: 'Укажите количество товара',
                side: 'right',
            },
        },
        {
            element: "#item-cost-price-field",
            popover: {
                title: 'Себестоимость',
                description: 'Укажите себестоимость товара. Можно редактировать',
                side: 'right',
            },
        },
        {
            element: "#item-sale-price-field",
            popover: {
                title: 'Цена продажи',
                description: 'Укажите цену продажи товара. Можно редактировать',
                side: 'right',
            },
        },
        {
            element: "#item-save-btn",
            popover: {
                title: 'Сохранить позицию',
                description: 'Нажмите для сохранения позиции в проекте',
                side: 'right',
            },
        },
    ]
});

export function nextOnboardingStep() {
    console.log('hello')
    if (onboarding.isActive()) {
        onboarding.moveNext();
    }
}

export function completeOnboarding() {
    if (onboarding.isActive()) {
        onboarding.destroy();
    }
}