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
    const { plan, userId, userEmail, promoCode } = body;

    console.log('Payment creation request:', { plan, userId, userEmail });

    // Проверяем промокод и используем готовые ссылки
    if (promoCode === 'DATATRACE25') {
      const promoLinks = {
        basic: 'https://self.payanyway.ru/17591628606561',
        'professional-6': 'https://self.payanyway.ru/17591629735214',
        'professional-12': 'https://self.payanyway.ru/17591630893195'
      };
      
      const paymentUrl = promoLinks[plan as keyof typeof promoLinks];
      if (paymentUrl) {
        return NextResponse.json({
          ok: true,
          paymentUrl,
          transactionId: `promo_${Date.now()}`,
          amount: 0, // Сумма со скидкой
          promoApplied: true
        });
      }
    }

    // Обычная логика без промокода
    const planPrices = {
      basic: 500,
      professional: 5000
    };

    const amount = planPrices[plan as keyof typeof planPrices];
    if (!amount) {
      return NextResponse.json(
        { error: 'Неверный тариф' },
        { status: 400 }
      );
    }

    const transactionId = paymentService.createTransactionId(
      `plan_${plan}`,
      userId
    );

    const paymentParams = {
      amount,
      transactionId,
      description: `Оплата тарифа ${plan.toUpperCase()} - DataTrace`,
      subscriberId: userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?plan=${plan}&email=${encodeURIComponent(userEmail)}`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`
    };

    const paymentUrl = paymentService.createPaymentUrl(paymentParams);

    return NextResponse.json({
      ok: true,
      paymentUrl,
      transactionId,
      amount,
      promoApplied: false
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    );
  }
}
