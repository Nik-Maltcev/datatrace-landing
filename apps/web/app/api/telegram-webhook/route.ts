import { NextRequest, NextResponse } from 'next/server';

// Простой webhook для Telegram бота
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Проверяем, что это сообщение от пользователя
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const firstName = body.message.from.first_name || 'Пользователь';
      
      console.log(`📱 Сообщение от ${firstName} (${chatId}): ${text}`);
      
      // Если пользователь написал /start
      if (text.startsWith('/start')) {
        const welcomeMessage = `👋 Привет, ${firstName}!

🔐 <b>DataTrace OTP Bot</b>

Этот бот поможет вам получать коды подтверждения для верификации номера телефона на сайте DataTrace.

📋 <b>Как это работает:</b>
1️⃣ На сайте нажимаете "Отправить код в Telegram"
2️⃣ Получаете код в этом чате
3️⃣ Вводите код на сайте

⚡ Готово! Теперь вы можете получать коды подтверждения.`;

        // Отправляем приветственное сообщение
        await sendTelegramMessage(chatId, welcomeMessage);
        
        // Сохраняем связь chat_id с пользователем (пока просто логируем)
        console.log(`💾 Новый пользователь зарегистрировался: ${chatId} (${firstName})`);
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