import { NextRequest, NextResponse } from 'next/server';
import { TelegramGateway } from '@/lib/telegram-gateway';

export async function GET(request: NextRequest) {
  try {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!telegramBotToken) {
      return NextResponse.json({ 
        error: 'TELEGRAM_BOT_TOKEN не настроен',
        connected: false 
      }, { status: 400 });
    }
    
    const telegramGateway = new TelegramGateway(telegramBotToken);
    const isValid = await telegramGateway.validateBot();
    
    return NextResponse.json({ 
      connected: isValid,
      message: isValid ? 'Telegram Bot подключен успешно' : 'Ошибка подключения к Telegram Bot'
    });
    
  } catch (error) {
    console.error('Ошибка проверки Telegram Bot:', error);
    return NextResponse.json({ 
      error: 'Ошибка проверки бота',
      connected: false 
    }, { status: 500 });
  }
}