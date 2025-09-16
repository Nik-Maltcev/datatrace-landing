import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Временное хранилище кодов (в продакшене лучше использовать Redis)
declare global {
  var otpStorage: Map<string, any>;
}

if (!global.otpStorage) {
  global.otpStorage = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    // Валидация номера телефона
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Неверный формат номера телефона' }, { status: 400 });
    }
    
    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = crypto.randomUUID();
    
    // Сохраняем код на 5 минут
    const otpKey = `${phone}_${sessionId}`;
    global.otpStorage.set(otpKey, {
      code,
      createdAt: Date.now(),
      phone,
      verified: false
    });
    
    // Удаляем через 5 минут
    setTimeout(() => {
      global.otpStorage.delete(otpKey);
    }, 5 * 60 * 1000);
    
    // TODO: Интеграция с Telegram Gateway
    // const telegramGateway = new TelegramGateway(process.env.TELEGRAM_BOT_TOKEN);
    // await telegramGateway.sendVerificationCode(phone, code);
    
    // Пока что логируем код для тестирования
    console.log(`🔐 OTP код для ${phone}: ${code} (sessionId: ${sessionId})`);
    
    return NextResponse.json({ 
      success: true,
      sessionId,
      message: 'Код отправлен в Telegram',
      // В режиме разработки возвращаем код для тестирования
      ...(process.env.NODE_ENV === 'development' && { debug_code: code })
    });
    
  } catch (error) {
    console.error('Ошибка отправки OTP:', error);
    return NextResponse.json({ error: 'Ошибка отправки кода' }, { status: 500 });
  }
}