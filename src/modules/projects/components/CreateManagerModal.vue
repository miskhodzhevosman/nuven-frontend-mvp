<script setup>
import { reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../store'

const store = useProjectsStore()
const { error } = storeToRefs(store)

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'created'])

const managerForm = reactive({
  last_name: '',
  first_name: '',
  patronymic: '',
  username: '',
  email: '',
  password: '',
  password2: '',
  phone: '',
  telegram: '',
  wechat: '',
  whatsapp: '',
  is_active: true,
  is_staff: true,
  position: '',
  department: '',
})

function resetForm() {
  managerForm.last_name = ''
  managerForm.first_name = ''
  managerForm.patronymic = ''
  managerForm.username = ''
  managerForm.email = ''
  managerForm.password = ''
  managerForm.password2 = ''
  managerForm.phone = ''
  managerForm.telegram = ''
  managerForm.wechat = ''
  managerForm.whatsapp = ''
  managerForm.is_active = true
  managerForm.is_staff = true
  managerForm.position = ''
  managerForm.department = ''
}

async function submitCreateManager() {
  // Валидация ФИО
  if (!managerForm.last_name?.trim()) {
    error.value = 'Фамилия обязательна'
    return
  }
  if (!managerForm.first_name?.trim()) {
    error.value = 'Имя обязательно'
    return
  }
  
  // Валидация учетных данных
  if (!managerForm.username?.trim()) {
    error.value = 'Username обязателен'
    return
  }
  
  if (!managerForm.email?.trim()) {
    error.value = 'Email обязателен'
    return
  }
  
  if (managerForm.password.length < 8) {
    error.value = 'Пароль должен содержать минимум 8 символов'
    return
  }
  
  if (managerForm.password !== managerForm.password2) {
    error.value = 'Пароли не совпадают'
    return
  }
  
  const payload = {
    last_name: managerForm.last_name.trim(),
    first_name: managerForm.first_name.trim(),
    patronymic: managerForm.patronymic?.trim() || '',
    username: managerForm.username.trim().toLowerCase(),
    email: managerForm.email.trim().toLowerCase(),
    password: managerForm.password,
    password2: managerForm.password2,
    phone: managerForm.phone?.trim() || '',
    telegram: managerForm.telegram?.trim() || '',
    wechat: managerForm.wechat?.trim() || '',
    whatsapp: managerForm.whatsapp?.trim() || '',
    is_active: managerForm.is_active,
    is_staff: managerForm.is_staff,
    position: managerForm.position?.trim() || '',
    department: managerForm.department?.trim() || '',
  }
  
  try {
    const created = await store.createTechnicalManager(payload)
    emit('created', created)
  } catch (e) {
    console.error('Failed to create manager:', e)
    
    // Обработка ошибок от сервера
    if (e.response?.data) {
      const errors = e.response.data
      
      if (errors.username) {
        error.value = `Username: ${errors.username.join(', ')}`
      } else if (errors.email) {
        error.value = `Email: ${errors.email.join(', ')}`
      } else if (errors.password) {
        error.value = `Пароль: ${errors.password.join(', ')}`
      } else if (errors.non_field_errors) {
        error.value = errors.non_field_errors.join(', ')
      } else if (typeof errors === 'object') {
        const messages = Object.values(errors).flat().join(', ')
        error.value = messages || 'Ошибка создания менеджера'
      } else {
        error.value = errors.detail || 'Ошибка создания менеджера'
      }
    } else {
      error.value = 'Ошибка создания менеджера'
    }
  }
}

function close() {
  resetForm()
  emit('close')
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal modal-md">
      <h2>Новый технический менеджер</h2>
      <form @submit.prevent="submitCreateManager">
        <!-- Основная информация -->
        <div class="form-section">
          <h3>Основная информация</h3>
          
          <label class="field required">
            <span>Фамилия</span>
            <input 
              v-model="managerForm.first_name" 
              type="text" 
              required 
              maxlength="255" 
              placeholder="Введите Фамилию менеджера" 
            />
          </label>

          <label class="field required">
            <span>Имя</span>
            <input 
              v-model="managerForm.last_name" 
              type="text" 
              required 
              maxlength="255" 
              placeholder="Введите Имя менеджера" 
            />
          </label>

          <label class="field">
            <span>Отчество</span>
            <input 
              v-model="managerForm.patronymic" 
              type="text" 
              required 
              maxlength="255" 
              placeholder="Введите Отчество менеджера" 
            />
          </label>
          
          <label class="field required">
            <span>Username *</span>
            <input 
              v-model="managerForm.username" 
              type="text" 
              required 
              maxlength="150" 
              placeholder="Введите username (логин)" 
            />
            <small class="hint">Уникальное имя пользователя для входа</small>
          </label>
          
          <label class="field required">
            <span>Email *</span>
            <input 
              v-model="managerForm.email" 
              type="email" 
              required 
              maxlength="254" 
              placeholder="Введите email" 
            />
          </label>
          
          <label class="field required">
            <span>Пароль *</span>
            <input 
              v-model="managerForm.password" 
              type="password" 
              required 
              minlength="8" 
              placeholder="Минимум 8 символов" 
            />
            <small class="hint">Пароль должен содержать минимум 8 символов</small>
          </label>
          
          <label class="field required">
            <span>Подтверждение пароля *</span>
            <input 
              v-model="managerForm.password2" 
              type="password" 
              required 
              placeholder="Повторите пароль" 
            />
          </label>
        </div>

        <!-- Контактная информация -->
        <div class="form-section">
          <h3>Контактная информация</h3>
          
          <label class="field">
            <span>Телефон</span>
            <input 
              v-model="managerForm.phone" 
              type="tel" 
              maxlength="20" 
              placeholder="+7 (123) 456-78-90" 
            />
          </label>
          
          <label class="field">
            <span>Telegram</span>
            <input 
              v-model="managerForm.telegram" 
              type="text" 
              maxlength="100" 
              placeholder="@username или ID" 
            />
          </label>
          
          <label class="field">
            <span>WeChat</span>
            <input 
              v-model="managerForm.wechat" 
              type="text" 
              maxlength="100" 
              placeholder="WeChat ID" 
            />
          </label>
          
          <label class="field">
            <span>WhatsApp</span>
            <input 
              v-model="managerForm.whatsapp" 
              type="text" 
              maxlength="20" 
              placeholder="+7 (123) 456-78-90" 
            />
          </label>
        </div>

        <!-- Дополнительные настройки -->
        <div class="form-section">
          <h3>Дополнительные настройки</h3>
          
          <div class="checkbox-group">
            <label class="checkbox">
              <input 
                v-model="managerForm.is_active" 
                type="checkbox" 
              />
              <span>Активен</span>
            </label>
            
            <label class="checkbox">
              <input 
                v-model="managerForm.is_staff" 
                type="checkbox" 
              />
              <span>Доступ в админку</span>
            </label>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Создание...' : 'Создать менеджера' }}
          </button>
        </div>
        
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   МОДАЛЬНЫЕ ОКНА
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-md {
  max-width: 600px;
}

.modal h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #2C3E50;
}

/* ============================================
   СЕКЦИИ ФОРМЫ
   ============================================ */
.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #2C3E50;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* ============================================
   ПОЛЯ ФОРМ
   ============================================ */
.field {
  display: block;
  margin-bottom: 16px;
}

.field span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(26, 26, 26, 0.6);
  font-weight: 500;
}

.field.required span::after {
  content: ' *';
  color: #DC2626;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  background: #F8F9FA;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  transition: all 0.2s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(26, 26, 26, 0.25);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #2C3E50;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.field select option {
  background: #FFFFFF;
  color: #1A1A1A;
}

.field textarea {
  resize: vertical;
  min-height: 60px;
}

/* ============================================
   ЧЕКБОКСЫ
   ============================================ */
.checkbox-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #1A1A1A;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2C3E50;
}

/* ============================================
   ПОДСКАЗКИ (HINT)
   ============================================ */
.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(26, 26, 26, 0.35);
}

.hint.success {
  color: #16A34A;
}

/* ============================================
   ДЕЙСТВИЯ В МОДАЛКЕ
   ============================================ */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2C3E50;
  color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
  background: #34495E;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.25);
}

.btn-ghost {
  background: transparent;
  color: #1A1A1A;
  border-color: rgba(0, 0, 0, 0.12);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* ============================================
   АЛЕРТЫ / ОШИБКИ
   ============================================ */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(220, 38, 38, 0.08);
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.15);
}

.alert-error strong {
  color: #DC2626;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .modal {
    padding: 20px;
    max-width: 100%;
    margin: 8px;
  }
  
  .checkbox-group {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
    margin: 4px;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 8px;
  }
}
</style>