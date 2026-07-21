// onboardings/NomenclatureCreateOnboarding.js
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
                description: 'Нажмите для добавления новой позиции',
                side: 'left',
            },
        },
        {
            element: "#item-create-nomenclature-btn",
            popover: {
                title: 'Создать новый товар',
                description: 'Нажмите, чтобы создать новый товар',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-name-field",
            popover: {
                title: 'Название товара',
                description: 'Введите название товара',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-technical-name-field",
            popover: {
                title: 'Техническое название',
                description: 'Введите техническое название товара (опционально)',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-type-field",
            popover: {
                title: 'Тип товара',
                description: 'Выберите тип: Товар или Услуга',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-article-field",
            popover: {
                title: 'Артикул',
                description: 'Введите артикул товара (опционально)',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-factory-field",
            popover: {
                title: 'Фабрика',
                description: 'Выберите фабрику',
                side: 'right',
            },
        },
         {
            element: "#create-factory-btn",
            popover: {
                title: 'Или создайте новую',
                description: 'Нажмите для создания новой фабрики',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-cost-price-field",
            popover: {
                title: 'Текущая себестоимость',
                description: 'Укажите текущую себестоимость товара',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-sale-price-field",
            popover: {
                title: 'Текущая цена продажи',
                description: 'Укажите текущую цену продажи товара',
                side: 'right',
            },
        },
        {
            element: "#nomenclature-save-btn",
            popover: {
                title: 'Сохранить товар',
                description: 'Нажмите для сохранения нового товара',
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