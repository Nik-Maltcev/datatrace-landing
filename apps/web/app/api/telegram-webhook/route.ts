import { NextRequest, NextResponse } from 'next/server';

// Временное хранилище пользователей (в продакшене использовать базу данных)
declare global {
  var telegramUsers: Map<string, { chatId: number; username?: string; firstName?: string }>;
}

if (!global.telegramUsers) {
  global.telegramUsers = new Map();
}

// Простой webhook для Telegram бота
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📨 Получено webhook сообщение:', body);
    
    // Проверяем, что это сообщение от пользователя
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const firstName = body.message.from.first_name || 'Пользователь';
      const username = body.message.from?.username;
      
      console.log(`📱 Сообщение от ${firstName} (${chatId}): ${text}`);
      
      // Если пользователь написал /start
      if (text.startsWith('/start')) {
        // Сохраняем пользователя
        global.telegramUsers.set(chatId.toString(), {
          chatId,
          username,
          firstName
        });
        
        const welcomeMessage = `👋 Привет, ${firstName}!

🔐 <b>DataTrace OTP Bot</b>

Этот бот поможет вам получать коды подтверждения для верификации номера телефона на сайте DataTrace.

📋 <b>Как это работает:</b>
1️⃣ Отправьте боту ваш номер телефона (например: +79001234567)
2️⃣ На сайте нажмите "Отправить код в Telegram"  
3️⃣ Получите код в этом чате
4️⃣ Введите код на сайте

💡 <b>Сначала отправьте ваш номер телефона!</b>`;

        await sendTelegramMessage(chatId, welcomeMessage);
        
        console.log(`💾 Новый пользователь зарегистрировался: ${chatId} (${firstName})`);
      }
      // Если пользователь отправил номер телефона
      else if (text.match(/^\+?\d{10,15}$/)) {
        const phoneNumber = text.replace(/\D/g, '');
        const normalizedPhone = phoneNumber.startsWith('8') ? '7' + phoneNumber.substring(1) : phoneNumber;
        
        // Сохраняем связь номера с chat_id
        global.telegramUsers.set(`phone_${normalizedPhone}`, {
          chatId,
          username,
          firstName
        });
        
        console.log(`📞 Номер ${normalizedPhone} привязан к чату ${chatId}`);
        
        await sendTelegramMessage(chatId, 
          `✅ Номер <b>${text}</b> успешно привязан к вашему аккаунту!
          
Теперь:
🔹 Идите на сайт DataTrace
🔹 В разделе "Подтверждение номера" нажмите "Отправить код"
🔹 Код придет в этот чат

🎯 Готов принимать коды!`
        );
      }
      // Другие сообщения
      else {
        await sendTelegramMessage(chatId, `� Чтобы получать коды подтверждения:

1️⃣ Отправьте ваш номер телефона в формате: +79001234567
2️⃣ После привязки номера используйте сайт для получения кодов

💡 Нужна помощь? Напишите /start`);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ошибка webhook:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function sendTelegramMessage(chatId: string | number, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    console.log('📤 Сообщение отправлено:', result.ok);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
  }
}