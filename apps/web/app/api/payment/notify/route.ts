import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PayAnyWayService = require('@/lib/services/PayAnyWayService');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    let email = (params.customerEmail || params.MNT_SUBSCRIBER_ID) as string;
    
    // Декодируем URL-encoded email
    if (email) {
      email = decodeURIComponent(email);
    }
    
    const transactionId = params.MNT_TRANSACTION_ID as string;
    
    console.log('PayAnyWay params:', params);
    console.log('Available keys:', Object.keys(params));
    console.log('MNT_TRANSACTION_ID from params:', transactionId);
    console.log('Extracted email:', email);
    
    // Убираем префикс mailto: если есть
    if (email.startsWith('mailto:')) {
      email = email.replace('mailto:', '');
    }
    
    // Если нет MNT_TRANSACTION_ID, создаем уникальный ID на основе email и времени
    const finalTransactionId = transactionId || `payment_${email}_${Date.now()}`;
    console.log('Final transaction ID:', finalTransactionId);
    
    const price = parseFloat((params.productPrice || params.MNT_AMOUNT) as string) || 0;
    console.log('Extracted price:', price, 'from productPrice:', params.productPrice, 'or MNT_AMOUNT:', params.MNT_AMOUNT);
    
    // Определяем план по MNT_CUSTOM1 (ID плана) или цене как резерв
    let plan = 'professional'; // по умолчанию
    const planId = params.MNT_CUSTOM1 as string;
    
    console.log('Plan ID from MNT_CUSTOM1:', planId);
    
    if (planId === '1') {
      plan = 'basic';
    } else if (planId === '2' || planId === '3') {
      plan = 'professional';
    } else {
      // Резервная логика по цене для совместимости
      if (price <= 350) {
        plan = 'basic';
      } else if (price <= 5000) {
        plan = 'professional';
      } else if (price <= 8500) {
        plan = 'professional';
      }
    }
    
    console.log(`Plan determined by price ${price}: ${plan}`);
    console.log(`Transaction ID: ${finalTransactionId}`);
    const planLimits = {
      free: 0,
      basic: 1,
      professional: 2
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits] || 0;
    
    console.log(`Processing payment: ${price} RUB for ${email}, plan: ${plan}, transactionId: ${finalTransactionId}`);

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
            
            // Сохраняем информацию о транзакции
            const { error: transactionError } = await supabase
              .from('payment_transactions')
              .upsert({
                transaction_id: finalTransactionId,
                user_id: userResult.user.id,
                email: email,
                plan: plan,
                amount: price,
                status: 'completed',
                processed_at: new Date().toISOString()
              });
              
            if (transactionError) {
              console.error('Error saving transaction:', transactionError);
            } else {
              console.log('Transaction saved successfully');
            }
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