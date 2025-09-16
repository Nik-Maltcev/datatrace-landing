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
  async sendOTPCode(phone: string, code: string): Promise<boolean> {
    // В реальной реализации нужно будет найти chat_id по номеру телефона
    // Пока что этот метод требует дополнительной настройки бота
    
    const message = `🔐 <b>Код подтверждения DataTrace:</b> 
    
<code>${code}</code>

Введите этот код на сайте для подтверждения номера телефона.

⏰ Код действителен 5 минут.`;

    // TODO: Реализовать поиск chat_id по номеру телефона
    // Для этого нужно настроить базу данных связей phone -> chat_id
    
    console.log(`📱 OTP код для ${phone}: ${code}`);
    console.log(`💬 Сообщение для отправки: ${message}`);
    
    return true; // Пока возвращаем true для тестирования
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