import axios from 'axios';

export class TelegramGateway {
  private botToken: string;
  private baseURL = 'https://api.telegram.org';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  private getChatIdByPhone(phone: string): number | null {
    // Нормализуем номер телефона - убираем все кроме цифр
    let normalizedPhone = phone.replace(/\D/g, '');
    
    // Конвертируем 8 в 7 для российских номеров
    if (normalizedPhone.startsWith('8') && normalizedPhone.length === 11) {
      normalizedPhone = '7' + normalizedPhone.substring(1);
    }
    
    // Добавляем 7 если номер без кода страны
    if (normalizedPhone.length === 10) {
      normalizedPhone = '7' + normalizedPhone;
    }
    
    console.log('🔍 Ищем chat_id для номера:', phone, '→ нормализованный:', normalizedPhone);
    
    const userData = global.telegramUsers?.get(`phone_${normalizedPhone}`);
    
    if (userData) {
      console.log('✅ Найден chat_id:', userData.chatId, 'для номера:', normalizedPhone);
      return userData.chatId;
    }
    
    console.log('❌ Chat_id не найден для номера:', normalizedPhone);
    console.log('💾 Доступные привязки:', Array.from(global.telegramUsers?.keys() || []));
    return null;
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }
      );
      
      return response.data.ok;
    } catch (error) {
      console.error('Telegram API error:', error);
      return false;
    }
  }

  // Для отправки OTP кода пользователю
  async sendOTPCode(phone: string, code: string): Promise<{ success: boolean, botUsername?: string }> {
    console.log('📞 Попытка отправки OTP кода для номера:', phone);
    
    const chatId = this.getChatIdByPhone(phone);
    
    if (!chatId) {
      console.log('❌ Chat_id не найден. Пользователь должен сначала привязать номер к боту.');
      
      // Возвращаем информацию о боте для инструкций
      try {
        const botInfo = await axios.get(`${this.baseURL}/bot${this.botToken}/getMe`);
        return {
          success: false,
          botUsername: botInfo.data.result.username
        };
      } catch (error) {
        return { success: false };
      }
    }

    const message = `🔐 <b>Код подтверждения DataTrace</b>

<code>${code}</code>

⏰ Код действителен 5 минут
🔒 Не передавайте код третьим лицам`;

    try {
      const response = await axios.post(
        `${this.baseURL}/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }
      );
      
      if (response.data.ok) {
        console.log('✅ OTP код успешно отправлен в Telegram');
        return { success: true };
      } else {
        console.error('❌ Ошибка отправки OTP:', response.data);
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Ошибка отправки OTP:', error);
      return { success: false };
    }
  }

  // Проверка токена бота
  async validateBot(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/bot${this.botToken}/getMe`);
      console.log('✅ Telegram Bot успешно подключен:', response.data.result);
      return response.data.ok;
    } catch (error) {
      console.error('❌ Ошибка подключения к Telegram Bot:', error);
      return false;
    }
  }
}