// onboardings/FactoryCreateOnboarding.js
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
                description: 'Начните с добавления позиции',
                side: 'left',
            },
        },
        {
            element: "#item-create-nomenclature-btn",
            popover: {
                title: 'Создать товар',
                description: 'Перейдите к созданию товара',
                side: 'right',
            },
        },
        {
            element: "#create-factory-btn",
            popover: {
                title: 'Создать фабрику',
                description: 'Нажмите для создания новой фабрики',
                side: 'right',
            },
        },
        {
            element: "#factory-name-field",
            popover: {
                title: 'Название фабрики',
                description: 'Введите название фабрики',
                side: 'right',
            },
        },
        {
            element: "#factory-address-field",
            popover: {
                title: 'Адрес фабрики',
                description: 'Введите адрес фабрики (опционально)',
                side: 'right',
            },
        },
        {
            element: "#factory-contacts-field",
            popover: {
                title: 'Контакты',
                description: 'Введите контактные данные (опционально)',
                side: 'right',
            },
        },
        {
            element: "#factory-save-btn",
            popover: {
                title: 'Сохранить фабрику',
                description: 'Нажмите для сохранения новой фабрики',
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