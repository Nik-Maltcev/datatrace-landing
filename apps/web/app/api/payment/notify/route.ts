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

    // Обновляем тариф пользователя в базе данных
    try {
      // Получаем email из MNT_SUBSCRIBER_ID
      const email = params.MNT_SUBSCRIBER_ID ? decodeURIComponent(params.MNT_SUBSCRIBER_ID as string) : null;
      
      if (email) {
        // Находим пользователя по email
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://datatrace-landing-production-6a5e.up.railway.app'}/api/find-user-by-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const userResult = await userResponse.json();
        
        if (userResult.ok && userResult.user) {
          // Обновляем тариф
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://datatrace-landing-production-6a5e.up.railway.app'}/api/update-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userResult.user.id, plan })
          });
          
          const updateResult = await updateResponse.json();
          
          if (updateResult.ok) {
            console.log(`Plan updated successfully for user ${userResult.user.id} (${email}) to ${plan}`);
          } else {
            console.error('Failed to update plan:', updateResult.error);
          }
        } else {
          console.error('User not found for email:', email);
        }
      }
    } catch (error) {
      console.error('Error updating user plan via webhook:', error);
    }
    
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