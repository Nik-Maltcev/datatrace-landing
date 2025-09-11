import { NextRequest, NextResponse } from 'next/server';

const PayAnyWayService = require('@/lib/services/PayAnyWayService');

export async function POST(request: NextRequest) {
  try {
    const paymentService = new PayAnyWayService();
    
    if (!paymentService.isConfigured()) {
      return NextResponse.json(
        { error: 'PayAnyWay не настроен' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { plan, userId, userEmail } = body;

    console.log('Payment creation request:', { plan, userId, userEmail });

    // Определяем сумму по тарифу
    const planPrices = {
      basic: 500,
      professional: 10 // Сделаем 10 рублей для тестирования
    };

    const amount = planPrices[plan as keyof typeof planPrices];
    if (!amount) {
      return NextResponse.json(
        { error: 'Неверный тариф' },
        { status: 400 }
      );
    }

    // Создаем уникальный ID транзакции
    const transactionId = paymentService.createTransactionId(
      `plan_${plan}`,
      userId
    );

    // Параметры для создания ссылки на оплату
    const paymentParams = {
      amount,
      transactionId,
      description: `Оплата тарифа ${plan.toUpperCase()} - DataTrace`,
      subscriberId: userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/redirect?plan=${plan}&email=${encodeURIComponent(userEmail)}&target=_blank`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`
    };

    // Создаем ссылку на оплату
    const paymentUrl = paymentService.createPaymentUrl(paymentParams);

    return NextResponse.json({
      ok: true,
      paymentUrl,
      transactionId,
      amount
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}