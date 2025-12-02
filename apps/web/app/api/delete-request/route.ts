import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fullName, phone, links } = await request.json();
    
    if (!fullName || !phone || !links) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = '@datatrace_crm';
    
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const message = `🗑️ <b>Заявка на удаление информации</b>\n\n👤 <b>ФИО:</b> ${fullName}\n📱 <b>Телефон:</b> <code>${phone}</code>\n🔗 <b>Ссылки:</b>\n${links}\n\n⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

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
    
    if (!result.ok) {
      console.error('❌ Telegram API error:', result);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Error in delete-request:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
