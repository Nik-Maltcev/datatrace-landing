import { NextRequest, NextResponse } from 'next/server';

const PayAnyWayService = require('@/lib/services/PayAnyWayService');

export async function POST(request: NextRequest) {
  try {
    // Получаем параметры уведомления
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries());

    console.log('PayAnyWay notification received:', params);
    console.log('All form data keys:', Object.keys(params));
    console.log('Full params object:', JSON.stringify(params, null, 2));

    // Проверяем что это успешная покупка
    if (params.action !== 'purchased') {
      console.log('Not a purchase notification, ignoring');
      return new Response('SUCCESS', { status: 200 });
    }

    // Получаем данные о платеже
    let email = params.customerEmail as string;
    // Убираем префикс mailto: если есть
    if (email.startsWith('mailto:')) {
      email = email.replace('mailto:', '');
    }
    
    const price = parseFloat(params.productPrice as string);
    
    // Пока просто считаем все платежи профессиональными для теста
    const plan = 'professional';
    
    console.log(`Forcing plan to: ${plan} for testing`);
    const planLimits = {
      basic: 1,
      professional: 2
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits];
    
    console.log(`Processing payment: ${price} RUB for ${email}, plan: ${plan}`);

    // Обновляем тариф пользователя в базе данных
    try {
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
          
          console.log('Update plan API response:', updateResult);
          
          if (updateResult.ok) {
            console.log(`Plan updated successfully for user ${userResult.user.id} (${email}) to ${plan}`);
          } else {
            console.error('Failed to update plan:', updateResult.error);
          }
        } else {
          console.error('User not found for email:', email);
          console.log('User search result:', userResult);
        }
      }
    } catch (error) {
      console.error('Error updating user plan via webhook:', error);
    }
    
    console.log(`Payment successful for email ${email}, plan: ${plan}, limit: ${checksLimit}`);

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