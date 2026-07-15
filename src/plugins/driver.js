// src/plugins/driver.js
import Driver from 'driver.js'

// НЕ ИМПОРТИРУЙТЕ CSS ЗДЕСЬ! (уже импортировано в main.js)
const Driver = require('driver.js') 
export const driver = new Driver({
  animate: true,
  opacity: 0.75,
  padding: 10,
  allowClose: true,
  overlayClickNext: false,
  doneBtnText: 'Готово 🎉',
  closeBtnText: 'Закрыть',
  nextBtnText: 'Далее →',
  prevBtnText: '← Назад',
  onStart: () => {
    console.log('Тур начался');
  },
  onDone: () => {
    console.log('Тур завершен');
    localStorage.setItem('tutorial_completed', 'true');
  }
});