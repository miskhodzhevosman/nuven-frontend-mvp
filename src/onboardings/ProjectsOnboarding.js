import { driver } from "driver.js";
import "driver.js/dist/driver.css"

let currentStep = 0;

export const onboarding = driver({
    showProgress: true,
    animate: true,
    steps: [
        {
            element: "#add-project-btn",
            popover: {
                title: 'Кнопка для создания проекта',
                description: 'Нажмите для создания нового проекта',
                side: 'right',
            },
        },
        {
    element: "#project-name-field",
    popover: {
        title: 'Название проекта',
        description: 'Введите название проекта',
        side: 'right',
    },
    },
    {
        element: "#project-date-field",
        popover: {
            title: 'Дата создания проекта',
            description: 'На данном этапе работы системы есть возможность добавлять проекты задним числом. Далее этой функции не будет',
            side: 'right',
        },
    },
    {
        element: "#project-clent-field",
        popover: {
            title: 'Клиент',
            description: 'Поле для выбора клиента',
            side: 'right',
        },
    },
    {
        element: "#client-list",
        popover: {
            title: 'Клиенты',
            description: 'Начните вводить ФИО клиента',
            side: 'right',
        },
    },
    {
        element: "#add-new-client-btn",
        popover: {
            title: 'Или заведите нового',
            description: 'Кнока создания нового клиента',
            side: 'right',
        },
    },
    {
        element: "#project-status-field",
        popover: {
            title: 'Статус проекта',
            description: 'По умолчанию новый, но можете выбрать любой, по своему усмотрению',
            side: 'right',
        },
    },
    {
        element: "#status-list",
        popover: {
            title: 'Выбор статуса',
            description: 'Нажмите для выбора нужного статуса',
            side: 'right',
        },
    },
    {
        element: "#tech-manager-field",
        popover: {
            title: 'Технический менеджер',
            description: 'Поле для выбора технического менеджера',
            side: 'right',
        },
    },
    {
        element: "#tech-manager-list",
        popover: {
            title: 'Выбор технического менеджера',
            description: 'Начните вводить ФИО технического менеджера',
            side: 'right',
        },
    },
    {
        element: "#add-new-tech-manager-btn",
        popover: {
            title: 'Или заведите нового',
            description: 'Кнопка создания нового технического менеджера',
            side: 'right',
        },
    },
    {
        element: "#project-location-field",
        popover: {
            title: 'Поле выбора локации проекта',
            description: 'Укажите нужный город. Страна добавиться в системе автоматически',
            side: 'right',
        },
    },
    {
        element: "#project-locatin-full-name",
        popover: {
            title: 'Полное название локации можете пропустить',
            description: 'Это поле автоматически создается в системе.',
            side: 'right',
        },
    },

    {
        element: "#project-create-btn",
        popover: {
            title: 'Сохранить проект',
            description: 'Если вы заполнили все данные, сохраните новый проект',
            side: 'right',
        },
    },
    ]
})

// tech-manager-list
// Функция для ручного перехода к следующему шагу
export function nextOnboardingStep() {
    const driverInstance = onboarding;
    if (driverInstance.isActive()) {
        driverInstance.moveNext();
    }
}

// Функция для перехода к конкретному шагу
export function goToOnboardingStep(stepIndex) {
    const driverInstance = onboarding;
    if (driverInstance.isActive()) {
        driverInstance.moveTo(stepIndex);
    }
}

export function completeOnboarding() {
    const driverInstance = onboarding;
    if (driverInstance.isActive()) {
        driverInstance.destroy();
    }
}