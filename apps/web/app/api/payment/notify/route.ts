import { NextRequest, NextResponse } from 'next/server';

const PayAnyWayService = require('@/lib/services/PayAnyWayService');

export async function POST(request: NextRequest) {
  try {
    const paymentService = new PayAnyWayService();
    
    if (!paymentService.isConfigured()) {
      return new Response('FAIL', { status: 200 });
    }

    // Получаем параметры уведомления
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('PayAnyWay notification received:', params);

    // Проверяем подпись
    if (!paymentService.verifyPaymentNotification(params)) {
      console.error('Invalid PayAnyWay signature');
      return new Response('FAIL', { status: 200 });
    }

    // Парсим transaction ID
    const { orderId, userId } = paymentService.parseTransactionId(
      params.MNT_TRANSACTION_ID as string
    );

    // Определяем тариф из orderId
    const plan = orderId.replace('plan_', '');
    const planLimits = {
      basic: 1,
      professional: 2
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits];
    if (!checksLimit) {
      console.error('Unknown plan:', plan);
      return new Response('FAIL', { status: 200 });
    }

    // Здесь должна быть логика обновления пользователя в базе данных
    // Пока что просто логируем успешную оплату
    console.log(`Payment successful for user ${userId}, plan: ${plan}, limit: ${checksLimit}`);

    // Возвращаем SUCCESS
    return new Response('SUCCESS', { status: 200 });

  } catch (error) {
    console.error('Payment notification error:', error);
    return new Response('FAIL', { status: 200 });
  }
}

// Также поддерживаем GET для проверочных запросов
export async function GET(request: NextRequest) {
  return new Response('OK', { status: 200 });
}