import { NextRequest, NextResponse } from 'next/server';

// Глобальный счетчик заявок
declare global {
  var courseRequestCounter: number;
}

if (!global.courseRequestCounter) {
  global.courseRequestCounter = 0;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    console.log('📞 Course phone request received:', phone);
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_COURSE_CHAT_ID;
    
    console.log('🔑 Telegram config:', { 
      hasBotToken: !!botToken,
      tokenPrefix: botToken ? botToken.substring(0, 10) + '...' : 'none',
      chatId: chatId 
    });
    
    if (!botToken || !chatId) {
      console.error('❌ Telegram credentials not configured');
      return NextResponse.json({ ok: true });
    }

    // Увеличиваем счетчик
    global.courseRequestCounter++;
    const requestNumber = global.courseRequestCounter;

    const message = `🎓 <b>Новая заявка с курса</b>\n\n<b>Номер заявки:</b> ${requestNumber}\n📱 <b>Номер:</b> <code>${phone}</code>\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

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
    console.log('📤 Telegram API response:', result);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Error sending to Telegram:', error);
    return NextResponse.json({ ok: true });
  }
}
