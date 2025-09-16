import axios from 'axios';

export class TelegramGateway {
  private botToken: string;
  private baseURL = 'https://api.telegram.org';

  constructor(botToken: string) {
    this.botToken = botToken;
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
  async sendOTPCode(phone: string, code: string, chatId?: string): Promise<{ success: boolean, botUsername?: string }> {
    if (!chatId) {
      // Если нет chatId, возвращаем информацию о боте для инструкций
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

    const message = `🔐 <b>Код подтверждения DataTrace:</b> 
    
<code>${code}</code>

Введите этот код на сайте для подтверждения номера телефона.

⏰ Код действителен 5 минут.`;

    try {
      const result = await this.sendMessage(chatId, message);
      return { success: result };
    } catch (error) {
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