import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Используем глобальное хранилище
declare global {
  var otpStorage: Map<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code, sessionId } = await request.json();
    
    if (!phone || !code || !sessionId) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    
    const otpKey = `${phone}_${sessionId}`;
    const otpData = global.otpStorage?.get(otpKey);
    
    if (!otpData) {
      return NextResponse.json({ error: 'Код не найден или истек' }, { status: 400 });
    }
    
    // Проверяем срок действия (5 минут)
    if (Date.now() - otpData.createdAt > 5 * 60 * 1000) {
      global.otpStorage.delete(otpKey);
      return NextResponse.json({ error: 'Код истек' }, { status: 400 });
    }
    
    if (otpData.code === code.trim()) {
      // Удаляем использованный код
      global.otpStorage.delete(otpKey);
      
      // Генерируем токен верификации
      const token = jwt.sign(
        { 
          phone, 
          verified: true,
          verifiedAt: Date.now()
        },
        process.env.JWT_SECRET || 'your-super-secure-jwt-secret-for-production-2025',
        { expiresIn: '24h' }
      );
      
      return NextResponse.json({ 
        success: true, 
        token,
        message: 'Номер успешно подтвержден'
      });
    } else {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Ошибка верификации OTP:', error);
    return NextResponse.json({ error: 'Ошибка верификации' }, { status: 500 });
  }
}