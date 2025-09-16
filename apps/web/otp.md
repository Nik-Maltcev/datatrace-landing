Реализация через Node.js
javascript
const axios = require('axios');

class TelegramGateway {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseURL = 'https://gatewayapi.telegram.org';
  }
  
  async sendVerificationCode(phone, code) {
    try {
      const response = await axios.post(
        `${this.baseURL}/sendVerificationMessage`,
        {
          phone_number: phone,
          code: code,
          // Дополнительные параметры
          callback_url: `${process.env.BASE_URL}/api/telegram-callback`
        },
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`Telegram Gateway error: ${error.message}`);
    }
  }
}
Гибридный подход для получения ответа
Лучшее решение — комбинированный подход:

1. Отправка кода через Telegram
javascript
app.post('/api/send-telegram-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Генерируем код
    const code = OTPGenerator.generateSecure(6);
    
    // Сохраняем в Redis с уникальным ID сессии
    const sessionId = crypto.randomUUID();
    await otpStorage.saveOTP(phone, code, sessionId);
    
    // Отправляем через Telegram Gateway
    await telegramGateway.sendVerificationCode(phone, code);
    
    res.json({ 
      success: true,
      sessionId, // Возвращаем ID для проверки статуса
      message: 'Код отправлен в Telegram'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отправки' });
  }
});
2. Ввод кода на сайте (рекомендуемый способ)
javascript
app.post('/api/verify-telegram-otp', async (req, res) => {
  try {
    const { phone, code, sessionId } = req.body;
    
    const otpData = await otpStorage.getOTP(phone, sessionId);
    
    if (!otpData) {
      return res.status(400).json({ error: 'Код не найден' });
    }
    
    if (otpData.code === code) {
      await otpStorage.deleteOTP(phone, sessionId);
      
      // Генерируем токен аутентификации
      const token = generateJWT({ 
        phone, 
        verified: true,
        verifiedAt: Date.now()
      });
      
      res.json({ 
        success: true, 
        token,
        message: 'Верификация успешна'
      });
    } else {
      res.status(400).json({ error: 'Неверный код' });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка верификации' });
  }
});
Альтернатива: Telegram Bot для автоответов
Если хотите полную автоматизацию через Telegram:

javascript
const { Telegraf } = require('telegraf');

class TelegramOTPBot {
  constructor(botToken) {
    this.bot = new Telegraf(botToken);
    this.setupHandlers();
  }
  
  setupHandlers() {
    // Обработка кодов от пользователей
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id;
      const code = ctx.message.text.trim();
      
      // Проверяем, ожидается ли код от этого пользователя
      const pendingVerification = await this.getPendingVerification(userId);
      
      if (pendingVerification && pendingVerification.code === code) {
        // Уведомляем сайт о успешной верификации
        await this.notifyWebsite(pendingVerification.sessionId, true);
        
        ctx.reply('✅ Номер телефона подтвержден!');
        await this.deletePendingVerification(userId);
      } else {
        ctx.reply('❌ Неверный код или время истекло');
      }
    });
  }
  
  async sendOTPToUser(userId, code, sessionId) {
    await this.savePendingVerification(userId, code, sessionId);
    
    await this.bot.telegram.sendMessage(
      userId, 
      `🔐 Ваш код подтверждения: ${code}\n\nОтправьте этот код в ответ для подтверждения номера.`
    );
  }
  
  async notifyWebsite(sessionId, success) {
    // WebSocket или webhook для уведомления сайта
    await axios.post(`${process.env.BASE_URL}/api/verification-callback`, {
      sessionId,
      success,
      timestamp: Date.now()
    });
  }
}
Интеграция на фронтенде
javascript
// Frontend polling для проверки статуса
async function checkVerificationStatus(sessionId) {
  const response = await fetch(`/api/check-verification/${sessionId}`);
  const data = await response.json();
  
  if (data.verified) {
    // Пользователь подтвержден
    localStorage.setItem('auth_token', data.token);
    window.location.href = '/dashboard';
  } else if (data.expired) {
    // Время истекло
    showError('Время верификации истекло');
  }
  // Продолжаем проверять каждые 2 секунды
}

// WebSocket для real-time обновлений
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'verification_success') {
    handleSuccessfulVerification(data.token);
  }
};
Рекомендация
Используйте гибридный подход: отправляйте код через Telegram Gateway (дешево и быстро), а пользователь вводит его на вашем сайте. Это:

Проще в реализации — не нужно сложная логика ботов

Лучше UX — пользователь остается на сайте

Безопаснее — полный контроль процесса

Дешевле — экономия на SMS в 10 раз

Telegram Gateway + ввод на сайте = оптимальное решение для вашего Node.js сервиса!