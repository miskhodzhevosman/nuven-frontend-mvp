<template>
  <div class="project-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="page-header__left">
        <Button 
          label="Назад к проектам" 
          icon="pi pi-arrow-left"
          @click="goBack" 
          class="p-button-text"
        />

        <div>
          <h1 class="page-title">{{ projectInfo?.name || 'Проект' }}</h1>
          <div class="page-subtitle">
            <Tag 
              v-if="projectInfo"
              :value="projectInfo.status_name"
              :severity="getStatusSeverity(projectInfo.status)"
              :rounded="true"
            />
          </div>
        </div>
      </div>

      <div class="page-header__right">
        <Button 
          label="Редактировать проект" 
          icon="pi pi-pencil"
          @click="openEditProject" 
        />
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
      <span>Загрузка проекта...</span>
    </div>

    <template v-else-if="projectInfo">
      <div class="project-layout">

        <!-- LEFT -->
        <div class="project-main">

          <!-- INFO -->
          <Card class="info-card">
            <template #title>
              <div class="card-header">
                <h2 class="card-title">Информация о проекте</h2>
              </div>
            </template>
            <template #content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">Статус</span>
                  <span class="info-item__value">
                    <Tag 
                      :value="projectInfo.status_name"
                      :severity="getStatusSeverity(projectInfo.status)"
                      :rounded="true"
                    />
                  </span>
                </div>

                <div class="info-item">
                  <span class="info-item__label">Клиент</span>
                  <span class="info-item__value">{{ projectInfo.client_name || '—' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-item__label">Менеджер</span>
                  <span class="info-item__value">{{ projectInfo.manager_name || '—' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-item__label">География</span>
                  <span class="info-item__value">{{ projectInfo.geography || '—' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-item__label">Создан</span>
                  <span class="info-item__value">{{ formatDate(projectInfo.created_at) }}</span>
                </div>
              </div>
            </template>
          </Card>
          
          <!-- ITEMS -->
          <Card class="items-card">
            <template #title>
              <div class="card-header">
                <div>
                  <h2 class="card-title">Позиции проекта</h2>
                  <p class="card-subtitle">Товары, количество и сумма продаж</p>
                </div>
                <Button 
                  label="Добавить позицию" 
                  icon="pi pi-plus"
                  @click="openCreateItem" 
                />
              </div>
            </template>
            <template #content>
              <div v-if="itemsRows.length" class="table-wrap">
                <DataTable 
                  :value="itemsRows" 
                  dataKey="id"
                  class="p-datatable-sm"
                  stripedRows
                >
                  <Column field="nomenclature_name" header="Товар" style="min-width: 150px">
                    <template #body="{ data }">
                      <strong>{{ data.nomenclature_name }}</strong>
                    </template>
                  </Column>

                  <Column field="quantity" header="Кол-во" style="width: 100px" />

                  <Column field="fixed_cost_price" header="Себестоимость" style="width: 150px">
                    <template #body="{ data }">
                      {{ formatMoney(data.fixed_cost_price) }}
                    </template>
                  </Column>

                  <Column field="fixed_sale_price" header="Цена продажи" style="width: 150px">
                    <template #body="{ data }">
                      {{ formatMoney(data.fixed_sale_price) }}
                    </template>
                  </Column>

                  <Column field="total_amount" header="Сумма" style="width: 150px">
                    <template #body="{ data }">
                      <span class="text-positive">{{ formatMoney(data.total_amount) }}</span>
                    </template>
                  </Column>

                  <Column header="Действия" style="width: 180px">
                    <template #body="{ data }">
                      <div class="table-actions">
                        <Button 
                          icon="pi pi-pencil" 
                          class="p-button-rounded p-button-sm p-button-text" 
                          @click="openEditItem(data)"
                          tooltip="Редактировать"
                          tooltipOptions="{ position: 'top' }"
                        />
                        <Button 
                          icon="pi pi-trash" 
                          class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                          @click="deleteItem(data.id)"
                          :loading="store.deletingProjectItemId === data.id"
                          tooltip="Удалить"
                          tooltipOptions="{ position: 'top' }"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>

              <div v-else class="empty-state">
                <i class="pi pi-box" style="font-size: 2rem; color: #9AA0A6;"></i>
                <h4>Позиции ещё не добавлены</h4>
                <p>Создайте первую позицию для этого проекта</p>
              </div>
            </template>
          </Card>

          <!-- PROJECT EXPENSES -->
          <Card class="expenses-card">
            <template #title>
              <div class="card-header">
                <div>
                  <h2 class="card-title">Проектные расходы</h2>
                  <p class="card-subtitle">Расходы, привязанные к проекту</p>
                </div>
                <Button 
                  label="Добавить расход" 
                  icon="pi pi-plus"
                  @click="openExpenseModal" 
                />
              </div>
            </template>
            <template #content>
              <div v-if="projectExpenses?.length" class="table-wrap">
                <DataTable 
                  :value="projectExpenses" 
                  dataKey="id"
                  class="p-datatable-sm"
                  stripedRows
                >
                  <Column header="Тип расхода">
                    <template #body="{ data }">
                      {{ getOperationTypeName(data.finance_operation_type) }}
                    </template>
                  </Column>

                  <Column field="date" header="Дата">
                    <template #body="{ data }">
                      {{ formatDate(data.date) }}
                    </template>
                  </Column>

                  <Column field="amount" header="Сумма">
                    <template #body="{ data }">
                      <span class="text-negative">{{ formatMoney(data.amount) }}</span>
                    </template>
                  </Column>

                  <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                      <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                        @click="deleteExpense(data.id)"
                        tooltip="Удалить"
                        tooltipOptions="{ position: 'top' }"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <div v-else class="empty-state">
                <i class="pi pi-credit-card" style="font-size: 2rem; color: #9AA0A6;"></i>
                <h4>Нет расходов</h4>
                <p>Добавьте первый проектный расход</p>
              </div>
            </template>
          </Card>

          <!-- CLIENT PAYMENTS -->
          <Card class="payments-card">
            <template #title>
              <div class="card-header">
                <div>
                  <h2 class="card-title">Оплаты клиентов</h2>
                  <p class="card-subtitle">Поступления от клиента по этому проекту</p>
                </div>
                <Button 
                  label="Добавить оплату" 
                  icon="pi pi-plus"
                  @click="openClientPaymentModal" 
                />
              </div>
            </template>
            <template #content>
              <div v-if="clientPayments?.length" class="table-wrap">
                <DataTable 
                  :value="clientPayments" 
                  dataKey="id"
                  class="p-datatable-sm"
                  stripedRows
                >
                  <Column field="date" header="Дата">
                    <template #body="{ data }">
                      {{ formatDate(data.date) }}
                    </template>
                  </Column>

                  <Column field="amount" header="Сумма">
                    <template #body="{ data }">
                      <span class="text-positive">{{ formatMoney(data.amount) }}</span>
                    </template>
                  </Column>

                  <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                      <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                        @click="deleteClientPayment(data.id)"
                        tooltip="Удалить"
                        tooltipOptions="{ position: 'top' }"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <div v-else class="empty-state">
                <i class="pi pi-money-bill" style="font-size: 2rem; color: #9AA0A6;"></i>
                <h4>Нет оплат клиента</h4>
                <p>Добавьте первую оплату клиента</p>
              </div>
            </template>
          </Card>

          <!-- FACTORY PAYMENTS -->
          <Card class="payments-card">
            <template #title>
              <div class="card-header">
                <div>
                  <h2 class="card-title">Оплаты фабрикам</h2>
                  <p class="card-subtitle">Платежи фабрикам по этому проекту</p>
                </div>
                <Button 
                  label="Добавить оплату" 
                  icon="pi pi-plus"
                  @click="openFactoryPaymentModal" 
                />
              </div>
            </template>
            <template #content>
              <div v-if="factoryPayments?.length" class="table-wrap">
                <DataTable 
                  :value="factoryPayments" 
                  dataKey="id"
                  class="p-datatable-sm"
                  stripedRows
                >
                  <Column header="Фабрика">
                    <template #body="{ data }">
                      {{ getFactoryName(data.counterparty) }}
                    </template>
                  </Column>

                  <Column field="date" header="Дата">
                    <template #body="{ data }">
                      {{ formatDate(data.date) }}
                    </template>
                  </Column>

                  <Column field="amount" header="Сумма">
                    <template #body="{ data }">
                      <span class="text-negative">{{ formatMoney(data.amount) }}</span>
                    </template>
                  </Column>

                  <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                      <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-sm p-button-text p-button-danger" 
                        @click="deleteFactoryPayment(data.id)"
                        tooltip="Удалить"
                        tooltipOptions="{ position: 'top' }"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <div v-else class="empty-state">
                <i class="pi pi-building" style="font-size: 2rem; color: #9AA0A6;"></i>
                <h4>Нет оплат фабрикам</h4>
                <p>Добавьте первую оплату фабрике</p>
              </div>
            </template>
          </Card>

        </div>

        <!-- RIGHT -->
        <aside class="project-sidebar">
          <Card class="finance-card">
            <template #title>
              <h2 class="card-title">Финансы</h2>
            </template>
            <template #content>
              <div class="finance-blocks">

                <!-- PLAN -->
                <div class="finance-block">
                  <h3>План</h3>

                  <div class="finance-row">
                    <span>Выручка</span>
                    <strong class="text-positive">{{ formatMoney(planned?.revenue ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>COGS</span>
                    <strong class="text-negative">{{ formatMoney(planned?.cogs ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Валовая прибыль</span>
                    <strong>{{ formatMoney(planned?.gross_profit ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Маржа</span>
                    <strong>
                      <Tag 
                        :value="`${planned?.margin ?? 0}%`"
                        :severity="getMarginSeverity(planned?.margin)"
                        :rounded="true"
                        size="small"
                      />
                    </strong>
                  </div>
                </div>

                <!-- FACT -->
                <div class="finance-block">
                  <h3>Факт</h3>

                  <div class="finance-row">
                    <span>Оплата от клиента</span>
                    <strong class="text-positive">{{ formatMoney(fact?.client_received ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Оплаты фабрикам</span>
                    <strong class="text-negative">{{ formatMoney(fact?.factory_paid ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Проектные расходы</span>
                    <strong class="text-negative">{{ formatMoney(fact?.project_expenses ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Операционные расходы</span>
                    <strong class="text-negative">{{ formatMoney(fact?.operation_expenses ?? 0) }}</strong>
                  </div>
                </div>

                <!-- CASHFLOW -->
                <div class="finance-block">
                  <h3>Cashflow</h3>

                  <div class="finance-row">
                    <span>Дебиторка</span>
                    <strong>{{ formatMoney(cashflow?.accounts_receivable ?? 0) }}</strong>
                  </div>

                  <div class="finance-row">
                    <span>Кредиторка</span>
                    <strong>{{ formatMoney(cashflow?.accounts_payable ?? 0) }}</strong>
                  </div>
                </div>

              </div>
            </template>
          </Card>
        </aside>

      </div>
    </template>

    <!-- MODALS -->
    
    <!-- EDIT PROJECT -->
    <Dialog
      v-model:visible="showProjectModal"
      header="Редактирование проекта"
      :modal="true"
      :style="{ width: '500px' }"
      class="p-fluid"
      @hide="closeProjectModal"
    >
      <form @submit.prevent="saveProject">
        <div class="field">
          <label for="project-name">Название</label>
          <InputText id="project-name" v-model="projectForm.name" />
        </div>

        <div class="field">
          <label for="project-geography">География</label>
          <InputText id="project-geography" v-model="projectForm.geography" />
        </div>

        <div class="field">
          <label for="project-client">Клиент</label>
          <Select 
            id="project-client"
            v-model="projectForm.client"
            :options="clients"
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите клиента"
          />
        </div>

        <div class="field">
          <label for="project-manager">Менеджер</label>
          <Select 
            id="project-manager"
            v-model="projectForm.tech_manager"
            :options="managers"
            optionLabel="full_name"
            optionValue="id"
            placeholder="Выберите менеджера"
          />
        </div>

        <div class="field">
          <label for="project-status">Статус</label>
          <Select 
            id="project-status"
            v-model="projectForm.status"
            :options="statuses"
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите статус"
          />
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showProjectModal = false" class="p-button-text" />
          <Button label="Сохранить" icon="pi pi-check" type="submit" :loading="store.saving" />
        </div>
      </form>
    </Dialog>

    <!-- EXPENSE -->
    <Dialog
      v-model:visible="showExpenseModal"
      header="Новый проектный расход"
      :modal="true"
      :style="{ width: '400px' }"
      class="p-fluid"
    >
      <form @submit.prevent="saveExpense">
        <div class="field">
          <label for="expense-amount">Сумма</label>
          <InputNumber 
            id="expense-amount"
            v-model="expenseForm.amount"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>

        <div class="field">
          <label for="expense-date">Дата</label>
          <DatePicker 
            id="expense-date"
            v-model="expenseForm.date"
            dateFormat="dd.mm.yy"
            :showIcon="true"
          />
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showExpenseModal = false" class="p-button-text" />
          <Button label="Сохранить" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>

    <!-- ITEM -->
    <Dialog
      v-model:visible="showItemModal"
      :header="editingItem ? 'Редактирование позиции' : 'Новая позиция проекта'"
      :modal="true"
      :style="{ width: '500px' }"
      class="p-fluid"
      @hide="showItemModal = false"
    >
      <form @submit.prevent="editingItem ? saveItemEdit() : saveItem()">
        <div class="field">
          <label>Номенклатура *</label>
          <div class="field-with-action">
            <Select 
              v-model="itemForm.nomenclature"
              :options="store.nomenclatures"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите товар"
              class="flex-1"
            />
            <Button 
              icon="pi pi-plus" 
              label="Создать"
              size="small"
              @click="openCreateNomenclature"
            />
          </div>
          <small v-if="store.nomenclatures.length === 0" class="text-muted">
            Нет доступных товаров. Создайте новый.
          </small>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Количество</label>
            <InputNumber 
              v-model="itemForm.quantity"
              min="1"
              :useGrouping="false"
            />
          </div>

          <div class="field">
            <label>Себестоимость</label>
            <InputNumber 
              v-model="itemForm.fixed_cost_price"
              mode="currency"
              currency="CNY"
              locale="ru-RU"
              min="0"
            />
          </div>

          <div class="field">
            <label>Цена продажи</label>
            <InputNumber 
              v-model="itemForm.fixed_sale_price"
              mode="currency"
              currency="CNY"
              locale="ru-RU"
              min="0"
            />
          </div>
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showItemModal = false" class="p-button-text" />
          <Button 
            label="Сохранить" 
            icon="pi pi-check" 
            type="submit"
            :disabled="!itemForm.nomenclature"
          />
        </div>
      </form>
    </Dialog>

    <!-- CREATE NOMENCLATURE -->
<Dialog
    v-model:visible="showCreateNomenclatureModal"
    header="Создание нового товара"
    :modal="true"
    :style="{ width: '500px' }"
    class="p-fluid"
    @hide="closeCreateNomenclature"
  >
    <form @submit.prevent="saveNewNomenclature">
      <div class="field">
        <label>Название товара *</label>
        <InputText v-model="createNomenclatureForm.name" placeholder="Введите название" />
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Техническое название</label>
          <InputText v-model="createNomenclatureForm.technical_name" placeholder="Опционально" />
        </div>

        <div class="field">
          <label>Артикул</label>
          <InputText v-model="createNomenclatureForm.article" placeholder="Опционально" />
        </div>

        <div class="field">
          <label>Себестоимость</label>
          <InputNumber 
            v-model="createNomenclatureForm.current_cost_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>

        <div class="field">
          <label>Цена продажи</label>
          <InputNumber 
            v-model="createNomenclatureForm.current_sale_price"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>
      </div>

      <div class="field">
        <label>Фабрика (опционально)</label>
        <div class="field-with-action">
          <Select 
            v-model="createNomenclatureForm.factory"
            :options="factoriesForNomenclature"
            optionLabel="name"
            optionValue="id"
            placeholder="Не выбрано"
          />
          <Button 
            icon="pi pi-plus" 
            label="Новая"
            size="small"
            @click="openFactoryModal"
            class="action-btn"
          />
        </div>
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="showCreateNomenclatureModal = false" class="p-button-text" />
        <Button 
          label="Создать товар" 
          icon="pi pi-check" 
          type="submit"
          :disabled="!createNomenclatureForm.name || store.saving"
          :loading="store.saving"
        />
      </div>
    </form>
  </Dialog>

  <!-- Модалка создания фабрики -->
  <Dialog
    v-model:visible="showFactoryModal"
    header="Создать фабрику"
    :modal="true"
    :style="{ width: '450px' }"
    class="p-fluid"
  >
    <form @submit.prevent="handleCreateFactory">
      <div class="field">
        <label for="factory-name">Название <span class="req">*</span></label>
        <InputText
          id="factory-name"
          v-model="factoryForm.name"
          required
        />
      </div>

      <div class="field">
        <label for="factory-address">Адрес</label>
        <InputText
          id="factory-address"
          v-model="factoryForm.address"
        />
      </div>

      <div class="field">
        <label for="factory-contacts">Контакты</label>
        <InputText
          id="factory-contacts"
          v-model="factoryForm.contacts"
        />
      </div>

      <div v-if="factoryErrorMessage" class="p-message p-message-error">
        <i class="pi pi-exclamation-circle"></i>
        {{ factoryErrorMessage }}
      </div>

      <div class="modal-actions">
        <Button label="Отмена" icon="pi pi-times" @click="showFactoryModal = false" class="p-button-text" />
        <Button 
          label="Создать" 
          icon="pi pi-check" 
          type="submit"
          :loading="factoriesStore.saving"
          :disabled="factoriesStore.saving"
        />
      </div>
    </form>
  </Dialog>

    <!-- CLIENT PAYMENT -->
    <Dialog
      v-model:visible="showClientPaymentModal"
      header="Оплата клиента"
      :modal="true"
      :style="{ width: '400px' }"
      class="p-fluid"
    >
      <form @submit.prevent="saveClientPayment">
        <div class="field">
          <label>Дата</label>
          <DatePicker 
            v-model="clientPaymentForm.date"
            dateFormat="dd.mm.yy"
            :showIcon="true"
          />
        </div>

        <div class="field">
          <label>Сумма</label>
          <InputNumber 
            v-model="clientPaymentForm.amount"
            mode="currency"
            currency="CNY"
            locale="ru-RU"
            min="0"
          />
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showClientPaymentModal = false" class="p-button-text" />
          <Button label="Сохранить" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>

    <!-- FACTORY PAYMENT -->
        <!-- FACTORY PAYMENT -->
    <Dialog
      v-model:visible="showFactoryPaymentModal"
      header="Оплата фабрике"
      :modal="true"
      :style="{ width: '450px' }"
      class="p-fluid"
    >
      <form @submit.prevent="saveFactoryPayment">
        <div class="field">
          <label>Фабрика</label>
          <div class="field-with-action">
            <Select 
              v-model="factoryPaymentForm.counterparty"
              :options="factories"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите фабрику"
              :disabled="factoriesStore.loading"
              class="flex-1"
            />
            <Button 
              icon="pi pi-plus" 
              label="Новая"
              size="small"
              @click="openFactoryModalFromPayment"
              class="action-btn"
            />
          </div>
          <small v-if="factoriesStore.loading" class="text-warning">
            ⏳ Загрузка фабрик...
          </small>
          <small v-else-if="factories.length === 0" class="text-danger">
            ⚠️ Нет доступных фабрик
          </small>
          <small v-else class="text-success">
            ✅ Загружено фабрик: {{ factories.length }}
          </small>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Дата</label>
            <DatePicker 
              v-model="factoryPaymentForm.date"
              dateFormat="dd.mm.yy"
              :showIcon="true"
            />
          </div>

          <div class="field">
            <label>Сумма</label>
            <InputNumber 
              v-model="factoryPaymentForm.amount"
              mode="currency"
              currency="CNY"
              locale="ru-RU"
              min="0"
            />
          </div>
        </div>

        <div class="modal-actions">
          <Button label="Отмена" icon="pi pi-times" @click="showFactoryPaymentModal = false" class="p-button-text" />
          <Button label="Сохранить" icon="pi pi-check" type="submit" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useFactoriesStore } from '@/stores/factories.store'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getOperationTypes,
  createOperationType
} from '@/services/finance.service'

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const store = useProjectsStore()
const factoriesStore = useFactoriesStore()
const route = useRoute()
const router = useRouter()

const projectId = Number(route.params.id)

function getFactoryName(factoryId) {
  if (!factoryId) return '—'
  const factory = factories.value.find(f => f.id === factoryId)
  return factory ? factory.name : 'Неизвестная фабрика'
}

/* ===================== */
/* LOADING */
/* ===================== */
const loading = ref(false)

/* ===================== */
/* STORE DATA */
/* ===================== */
const project = computed(() => store.currentProject)
const projectInfo = computed(() => store.currentProjectInfo)
const finance = computed(() => store.currentProjectFinance)
const itemsRows = computed(() => store.currentProjectItemsRows)
const clients = computed(() => store.clients)
const managers = computed(() => store.managers)
const statuses = computed(() => store.statuses)

const factories = computed(() => {
  const items = factoriesStore.items
  if (!Array.isArray(items)) {
    return []
  }
  const sorted = [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return sorted
})

/* безопасные алиасы */
const planned = computed(() => finance.value?.planned || {})
const fact = computed(() => finance.value?.fact || {})
const cashflow = computed(() => finance.value?.cashflow || {})

/* ===================== */
/* FINANCE TYPES & DATA */
/* ===================== */
const operationTypes = ref([])
const transactions = ref([])

function getTypeId(code) {
  const list = Array.isArray(operationTypes.value) ? operationTypes.value : []
  return list.find(t => t.code === code)?.id
}

function getOperationTypeName(typeId) {
  const list = Array.isArray(operationTypes.value) ? operationTypes.value : []
  return list.find(t => t.id === typeId)?.name || '—'
}

const projectExpenses = computed(() => {
  const typeId = getTypeId('project_expense')
  if (!typeId) return []
  return transactions.value.filter(
    t => t.project === projectId && t.finance_operation_type === typeId
  )
})

const CLIENT_PAYMENT_TYPE_ID = 1
const FACTORY_PAYMENT_TYPE_ID = 2

const clientPayments = computed(() =>
  transactions.value.filter(
    t => t.project === projectId && t.finance_operation_type === CLIENT_PAYMENT_TYPE_ID
  )
)

const factoryPayments = computed(() =>
  transactions.value.filter(
    t => t.project === projectId && t.finance_operation_type === FACTORY_PAYMENT_TYPE_ID
  )
)

/* ===================== */
/* REFRESH ALL DATA */
/* ===================== */
async function refreshAllData() {
  console.log('🔄 Refreshing all project data...')
  try {
    await store.initProjectDetails(projectId)
    await loadTransactions()
    console.log('✅ All data refreshed')
  } catch (error) {
    console.error('❌ Error refreshing data:', error)
  }
}

/* ===================== */
/* INIT */
/* ===================== */
onMounted(async () => {
  loading.value = true
  try {
    await store.initProjectDetails(projectId)
    await loadOperationTypes()
    await loadTransactions()
    await factoriesStore.fetchFactories()
  } catch (error) {
    console.error('❌ Error during initialization:', error)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  store.clearCurrentProject()
})

async function loadOperationTypes() {
  const res = await getOperationTypes()
  operationTypes.value = Array.isArray(res)
    ? res
    : Array.isArray(res?.results)
      ? res.results
      : Array.isArray(res?.items)
        ? res.items
        : []
}

async function loadTransactions() {
  const res = await getTransactions()
  transactions.value = Array.isArray(res)
    ? res
    : Array.isArray(res?.results)
      ? res.results
      : Array.isArray(res?.items)
        ? res.items
        : []
}

/* ===================== */
/* EXPENSE MODAL */
/* ===================== */
const showExpenseModal = ref(false)
const expenseForm = reactive({
  amount: null,
  date: null
})

function openExpenseModal() {
  expenseForm.amount = null
  expenseForm.date = null
  showExpenseModal.value = true
}

async function saveExpense() {
  try {
    let typeId = getTypeId('project_expense')

    if (!typeId) {
      const created = await createOperationType({
        name: 'Project expense',
        code: 'project_expense'
      })
      const list = Array.isArray(operationTypes.value) ? operationTypes.value : []
      operationTypes.value = [...list, created]
      typeId = created.id
    }

        // Преобразуем дату в формат YYYY-MM-DD
    const dateString = expenseForm.date 
      ? new Date(expenseForm.date).toISOString().split('T')[0] 
      : null;

    await createTransaction({
      amount: Number(expenseForm.amount),
      date: dateString,
      project: projectId,
      counterparty: null,
      finance_operation_type: typeId
    })


    showExpenseModal.value = false
    await refreshAllData()
    console.log('✅ Expense created and data refreshed')
  } catch (error) {
    console.error('❌ Error saving expense:', error)
    alert('Ошибка при сохранении расхода')
  }
}

/* ===================== */
/* PROJECT ITEMS */
/* ===================== */
const showItemModal = ref(false)
const editingItem = ref(null)
const itemForm = reactive({
  nomenclature: null,
  quantity: 1,
  fixed_cost_price: 0,
  fixed_sale_price: 0,
})

function openCreateItem() {
  editingItem.value = null
  itemForm.nomenclature = null
  itemForm.quantity = 1
  itemForm.fixed_cost_price = 0
  itemForm.fixed_sale_price = 0
  showItemModal.value = true
}

function openEditItem(item) {
  editingItem.value = item
  itemForm.nomenclature = item.nomenclature
  itemForm.quantity = item.quantity
  itemForm.fixed_cost_price = item.fixed_cost_price
  itemForm.fixed_sale_price = item.fixed_sale_price
  showItemModal.value = true
}

async function saveItem() {
  try {
    await store.createProjectItem({
      project: projectId,
      ...itemForm
    })
    
    showItemModal.value = false
    await refreshAllData()
    console.log('✅ Item created and data refreshed')
  } catch (error) {
    console.error('❌ Error saving item:', error)
    alert('Ошибка при сохранении позиции')
  }
}

async function saveItemEdit() {
  try {
    if (editingItem.value) {
      await store.updateProjectItem(editingItem.value.id, {
        nomenclature: itemForm.nomenclature,
        quantity: itemForm.quantity,
        fixed_cost_price: itemForm.fixed_cost_price,
        fixed_sale_price: itemForm.fixed_sale_price,
      })
      editingItem.value = null
    }
    
    showItemModal.value = false
    await refreshAllData()
    console.log('✅ Item saved and data refreshed')
  } catch (error) {
    console.error('❌ Error saving item:', error)
    alert('Ошибка при сохранении позиции')
  }
}


/* ===================== */
/* CREATE FACTORY */
/* ===================== */

// const factoriesStore = useFactoriesStore()

// Состояние для модалки фабрики
const showFactoryModal = ref(false)
const factoryErrorMessage = ref('')

const factoryForm = reactive({
  name: '',
  address: '',
  contacts: '',
})

function openFactoryModal() {
  factoryForm.name = ''
  factoryForm.address = ''
  factoryForm.contacts = ''
  factoryErrorMessage.value = ''
  showFactoryModal.value = true
}

async function handleCreateFactory() {
  factoryErrorMessage.value = ''

  if (!factoryForm.name.trim()) {
    factoryErrorMessage.value = 'Введите название фабрики'
    return
  }

  try {
    const payload = {
      name: factoryForm.name.trim(),
      address: factoryForm.address.trim(),
      contacts: factoryForm.contacts.trim(),
    }

    const created = await factoriesStore.createFactory(payload)
    
    showFactoryModal.value = false
    
    await factoriesStore.fetchFactories()
    await nextTick()
    
    // Выбираем созданную фабрику в форме номенклатуры (если открыта)
    if (showCreateNomenclatureModal.value) {
      createNomenclatureForm.factory = created.id
    }
    
    // Выбираем созданную фабрику в форме оплаты фабрике (если открыта)
    if (showFactoryPaymentModal.value) {
      factoryPaymentForm.counterparty = created.id
    }
    
  } catch (error) {
    factoryErrorMessage.value = error?.message || 'Не удалось создать фабрику'
    console.error('❌ Create factory error:', error)
  }
}


function openFactoryModalFromPayment() {
  factoryForm.name = ''
  factoryForm.address = ''
  factoryForm.contacts = ''
  factoryErrorMessage.value = ''
  showFactoryModal.value = true
}

/* ===================== */
/* DELETE EXPENSE */
/* ===================== */
async function deleteExpense(id) {
  if (!confirm('Удалить расход?')) return
  
  try {
    await deleteTransaction(id)
    await refreshAllData()
    console.log('✅ Expense deleted and data refreshed')
  } catch (error) {
    console.error('❌ Error deleting expense:', error)
    alert('Ошибка при удалении расхода')
  }
}

/* ===================== */
/* DELETE ITEM */
/* ===================== */
async function deleteItem(id) {
  if (!confirm('Удалить позицию?')) return
  
  try {
    await store.deleteProjectItem(id)
    await refreshAllData()
    console.log('✅ Item deleted and data refreshed')
  } catch (error) {
    console.error('❌ Error deleting item:', error)
    alert('Ошибка при удалении позиции')
  }
}

// ===================== */
/* CREATE NOMENCLATURE */
/* ===================== */
const showCreateNomenclatureModal = ref(false)
const createNomenclatureForm = reactive({
  name: '',
  technical_name: '',
  article: '',
  current_cost_price: null,
  current_sale_price: null,
  factory: null,
})

const factoriesForNomenclature = computed(() => {
  const items = factoriesStore.items
  if (!Array.isArray(items)) return []
  return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

function openCreateNomenclature() {
  createNomenclatureForm.name = ''
  createNomenclatureForm.technical_name = ''
  createNomenclatureForm.article = ''
  createNomenclatureForm.current_cost_price = null
  createNomenclatureForm.current_sale_price = null
  createNomenclatureForm.factory = null
  
  if (factoriesStore.items.length === 0) {
    factoriesStore.fetchFactories()
  }
  
  showCreateNomenclatureModal.value = true
}

function closeCreateNomenclature() {
  showCreateNomenclatureModal.value = false
}

async function saveNewNomenclature() {
  try {
    const payload = {
      type: 'PRODUCT',
      name: createNomenclatureForm.name,
      technical_name: createNomenclatureForm.technical_name || createNomenclatureForm.name,
      article: createNomenclatureForm.article || '',
      current_cost_price: Number(createNomenclatureForm.current_cost_price) || 0,
      current_sale_price: Number(createNomenclatureForm.current_sale_price) || 0,
      factory: createNomenclatureForm.factory ? Number(createNomenclatureForm.factory) : null,
    }
    
    const result = await store.createNomenclature(payload)
    console.log('📦 Nomenclature created:', result)
    
    let newId = null
    
    if (result) {
      if (result.id) newId = result.id
      else if (result.pk) newId = result.pk
      else if (result.uuid) newId = result.uuid
      else if (result._id) newId = result._id
      else if (result.ID) newId = result.ID
      else if (result.nomenclature_id) newId = result.nomenclature_id
      else if (result.object_id) newId = result.object_id
      
      if (!newId && result.data) {
        newId = result.data.id || result.data.pk || result.data.uuid
      }
      
      if (!newId && Array.isArray(result) && result.length > 0) {
        const first = result[0]
        newId = first.id || first.pk || first.uuid
        if (newId) {
          Object.assign(result, first)
        }
      }
    }
    
    if (!newId) {
      console.log('⚠️ ID not found, reloading nomenclatures...')
      await store.loadNomenclatures()
      
      const found = store.nomenclatures.find(n => n.name === createNomenclatureForm.name)
      if (found) {
        newId = found.id || found.pk || found.uuid
        console.log('✅ Found in list:', newId)
        if (result) {
          Object.assign(result, found)
        }
      }
    }
    
    if (!newId) {
      throw new Error('Не удалось получить ID созданного товара')
    }
    
    if (result && !store.nomenclatures.find(n => (n.id || n.pk) === newId)) {
      if (!result.id) {
        result.id = newId
      }
      store.nomenclatures = [...store.nomenclatures, result]
    }
    
    itemForm.nomenclature = newId
    
    showCreateNomenclatureModal.value = false
    
    console.log('✅ Nomenclature created with ID:', newId)
    
  } catch (error) {
    console.error('❌ Error creating nomenclature:', error)
    alert('Ошибка при создании товара: ' + (error.message || 'Неизвестная ошибка'))
  }
}

/* ===================== */
/* CLIENT PAYMENTS */
/* ===================== */
const showClientPaymentModal = ref(false)
const clientPaymentForm = reactive({
  date: null,
  amount: null
})

function openClientPaymentModal() {
  clientPaymentForm.date = null
  clientPaymentForm.amount = null
  showClientPaymentModal.value = true
}

async function saveClientPayment() {
  try {
    const projectClientId = store.currentProject?.client || null

        // Преобразуем дату в формат YYYY-MM-DD
    const dateString = clientPaymentForm.date 
      ? new Date(clientPaymentForm.date).toISOString().split('T')[0] 
      : null;

    await createTransaction({
      project: projectId,
      counterparty: projectClientId,
      finance_operation_type: CLIENT_PAYMENT_TYPE_ID,
      date: dateString,
      amount: Number(clientPaymentForm.amount)
    })

    showClientPaymentModal.value = false
    await refreshAllData()
    console.log('✅ Client payment created and data refreshed')
  } catch (error) {
    console.error('❌ Error saving client payment:', error)
    alert('Ошибка при сохранении оплаты')
  }
}

async function deleteClientPayment(id) {
  if (!confirm('Удалить оплату клиента?')) return
  
  try {
    await deleteTransaction(id)
    await refreshAllData()
    console.log('✅ Client payment deleted and data refreshed')
  } catch (error) {
    console.error('❌ Error deleting client payment:', error)
    alert('Ошибка при удалении оплаты')
  }
}

/* ===================== */
/* FACTORY PAYMENTS */
/* ===================== */
const showFactoryPaymentModal = ref(false)
const factoryPaymentForm = reactive({
  counterparty: null,
  date: null,
  amount: null
})

function openFactoryPaymentModal() {
  factoryPaymentForm.counterparty = null
  factoryPaymentForm.date = null
  factoryPaymentForm.amount = null
  showFactoryPaymentModal.value = true
}

async function saveFactoryPayment() {
  try {
        // Преобразуем дату в формат YYYY-MM-DD
    const dateString = factoryPaymentForm.date 
      ? new Date(factoryPaymentForm.date).toISOString().split('T')[0] 
      : null;

    await createTransaction({
      project: projectId,
      counterparty: factoryPaymentForm.counterparty ? Number(factoryPaymentForm.counterparty) : null,
      finance_operation_type: FACTORY_PAYMENT_TYPE_ID,
      date: dateString,
      amount: Number(factoryPaymentForm.amount)
    })

    showFactoryPaymentModal.value = false
    await refreshAllData()
    console.log('✅ Factory payment created and data refreshed')
  } catch (error) {
    console.error('❌ Error saving factory payment:', error)
    alert('Ошибка при сохранении оплаты')
  }
}

async function deleteFactoryPayment(id) {
  if (!confirm('Удалить оплату фабрике?')) return
  
  try {
    await deleteTransaction(id)
    await refreshAllData()
    console.log('✅ Factory payment deleted and data refreshed')
  } catch (error) {
    console.error('❌ Error deleting factory payment:', error)
    alert('Ошибка при удалении оплаты')
  }
}

/* ===================== */
/* PROJECT EDIT MODAL */
/* ===================== */
const showProjectModal = ref(false)
const projectForm = reactive({
  name: '',
  geography: '',
  client: null,
  tech_manager: null,
  status: null,
})

function openEditProject() {
  if (!project.value) return

  Object.assign(projectForm, {
    name: project.value.name ?? '',
    geography: project.value.geography ?? '',
    client: project.value.client ?? null,
    tech_manager: project.value.tech_manager ?? null,
    status: project.value.status ?? null,
  })

  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
}

async function saveProject() {
  try {
    await store.updateProject(projectId, {
      name: projectForm.name,
      geography: projectForm.geography,
      client: Number(projectForm.client),
      tech_manager: Number(projectForm.tech_manager),
      status: Number(projectForm.status),
    })

    showProjectModal.value = false
    await refreshAllData()
    console.log('✅ Project updated and data refreshed')
  } catch (error) {
    console.error('❌ Error saving project:', error)
    alert('Ошибка при сохранении проекта')
  }
}

/* ===================== */
/* HELPERS */
/* ===================== */
function getStatusSeverity(statusId) {
  const status = store.statuses?.find(s => s.id === statusId)
  const name = (status?.name || '').toLowerCase()

  if (name.includes('работ') || name.includes('process') || name.includes('active')) return 'info'
  if (name.includes('заверш') || name.includes('done')) return 'success'
  if (name.includes('нов') || name.includes('draft')) return 'secondary'
  if (name.includes('отмен') || name.includes('cancel')) return 'danger'
  return 'info'
}

function getMarginSeverity(value) {
  if (value === null || value === undefined) return 'info'
  const num = Number(value)
  if (Number.isNaN(num)) return 'info'
  if (num > 20) return 'success'
  if (num > 10) return 'warning'
  return 'danger'
}

function goBack() {
  router.push('/projects')
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat('ru-RU').format(num)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.project-page {
  padding: 24px;
  background: #0E0F12;
  color: #D0D2D5;
  min-height: 100vh;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 12px;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #C9A86A;
}

.page-subtitle {
  margin-top: 4px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px;
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 12px;
}

.project-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.project-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.project-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* CARDS */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.card-title {
  margin: 0;
  font-size: 18px;
  color: #C9A86A;
}

.card-subtitle {
  margin: 4px 0 0 0;
  color: #9AA0A6;
  font-size: 14px;
}

/* INFO GRID */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item__label {
  font-size: 12px;
  color: #9AA0A6;
}

.info-item__value {
  font-weight: 500;
  color: #D0D2D5;
}

/* FINANCE */
.finance-blocks {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.finance-block h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #9AA0A6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #1E2024;
}

.finance-row span {
  color: #9AA0A6;
}

.finance-row strong {
  color: #D0D2D5;
}

/* TABLE ACTIONS */
.table-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.text-positive {
  color: #4CAF50;
}

.text-negative {
  color: #F44336;
}

.text-muted {
  color: #9AA0A6;
}

.text-warning {
  color: #FF9800;
}

.text-danger {
  color: #F44336;
}

.text-success {
  color: #4CAF50;
}

/* EMPTY STATE */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
}

.empty-state h4 {
  margin: 0;
  color: #D0D2D5;
}

.empty-state p {
  margin: 0;
  color: #9AA0A6;
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #2A2D33;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.field label {
  font-weight: 500;
  font-size: 14px;
  color: #D0D2D5;
}

.field-with-action {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-with-action .flex-1 {
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* PrimeVue overrides */
:deep(.p-card) {
  background: #16181C;
  border: 1px solid #2A2D33;
  border-radius: 12px;
  color: #D0D2D5;
}

:deep(.p-card .p-card-title) {
  color: #C9A86A;
}

:deep(.p-card .p-card-body) {
  padding: 20px;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #1E2024;
  color: #C9A86A;
  border-color: #2A2D33;
  padding: 10px 12px;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #16181C;
  color: #D0D2D5;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: #2A2D33;
  padding: 8px 12px;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #1E2024;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: #1A1C20;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even):hover) {
  background: #1E2024;
}

:deep(.p-dialog .p-dialog-header) {
  background: #16181C;
  color: #C9A86A;
  border-color: #2A2D33;
}

:deep(.p-dialog .p-dialog-content) {
  background: #16181C;
  color: #D0D2D5;
}

:deep(.p-dialog .p-dialog-footer) {
  background: #16181C;
  border-color: #2A2D33;
}

:deep(.p-inputtext) {
  background: #0E0F12;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-inputtext:focus) {
  border-color: #C9A86A;
  box-shadow: 0 0 0 2px rgba(201, 168, 106, 0.2);
}

:deep(.p-select) {
  background: #0E0F12;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-select:not(.p-disabled):hover) {
  border-color: #C9A86A;
}

:deep(.p-select .p-select-label) {
  color: #D0D2D5;
}

:deep(.p-select-panel) {
  background: #16181C;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-select-item.p-highlight) {
  background: rgba(201, 168, 106, 0.2);
  color: #C9A86A;
}

:deep(.p-select-item:hover) {
  background: #1E2024;
}

:deep(.p-inputnumber .p-inputnumber-input) {
  background: #0E0F12;
  border-color: #2A2D33;
  color: #D0D2D5;
}

:deep(.p-inputnumber .p-inputnumber-input:focus) {
  border-color: #C9A86A;
  box-shadow: 0 0 0 2px rgba(201, 168, 106, 0.2);
}

:deep(.p-datepicker) {
  background: #0E0F12;
  border-color: #2A2D33;
}

:deep(.p-datepicker .p-datepicker-header) {
  background: #16181C;
  color: #D0D2D5;
}

:deep(.p-datepicker table td) {
  color: #D0D2D5;
}

:deep(.p-datepicker table td.p-datepicker-today) {
  background: rgba(201, 168, 106, 0.2);
}

:deep(.p-datepicker table td.p-datepicker-today span) {
  color: #C9A86A;
}

:deep(.p-button.p-button-text) {
  color: #C9A86A;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(201, 168, 106, 0.1);
}

:deep(.p-button.p-button-danger.p-button-text) {
  color: #F44336;
}

:deep(.p-button.p-button-danger.p-button-text:hover) {
  background: rgba(244, 67, 54, 0.1);
}

:deep(.p-tag.p-tag-success) {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

:deep(.p-tag.p-tag-warning) {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

:deep(.p-tag.p-tag-danger) {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

:deep(.p-tag.p-tag-info) {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
}

:deep(.p-tag.p-tag-secondary) {
  background: rgba(158, 158, 158, 0.2);
  color: #9E9E9E;
}

:deep(.p-progressspinner-circle) {
  stroke: #C9A86A;
}

/* Responsive */
@media (max-width: 1024px) {
  .project-layout {
    grid-template-columns: 1fr;
  }

  .project-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .project-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__left {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>