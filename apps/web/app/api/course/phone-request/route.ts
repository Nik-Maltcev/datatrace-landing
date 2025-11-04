import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_COURSE_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured');
      return NextResponse.json({ ok: true });
    }

    const message = `🎓 <b>Новая заявка с курса</b>\n\n📱 Номер: <code>${phone}</code>\n⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return NextResponse.json({ ok: true });
  }
}
