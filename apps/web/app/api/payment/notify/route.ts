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

    console.log('🔔 PayAnyWay webhook received at:', new Date().toISOString());
    console.log('📋 All form data keys:', Object.keys(params));
    console.log('📄 Full params object:', JSON.stringify(params, null, 2));

    // Проверяем что это успешная покупка
    if (params.action !== 'purchased') {
      console.log('⚠️ Not a purchase notification, action:', params.action, 'ignoring');
      return new Response('SUCCESS', { status: 200 });
    }

    // Получаем данные о платеже
    let email = (params.customerEmail || params.MNT_SUBSCRIBER_ID) as string;
    
    console.log('🔍 Raw email from params:', {
      customerEmail: params.customerEmail,
      MNT_SUBSCRIBER_ID: params.MNT_SUBSCRIBER_ID,
      extractedEmail: email
    });
    
    // Декодируем URL-encoded email
    if (email) {
      email = decodeURIComponent(email);
      console.log('🔓 Decoded email:', email);
    }
    
    const transactionId = params.MNT_TRANSACTION_ID as string;
    
    // Убираем префикс mailto: если есть
    if (email && email.startsWith('mailto:')) {
      email = email.replace('mailto:', '');
      console.log('📧 Removed mailto prefix, final email:', email);
    }
    
    // Если нет MNT_TRANSACTION_ID, создаем уникальный ID на основе email и времени
    const finalTransactionId = transactionId || `payment_${email}_${Date.now()}`;
    console.log('🆔 Transaction ID:', finalTransactionId);
    
    const price = parseFloat((params.productPrice || params.MNT_AMOUNT) as string) || 0;
    console.log('💰 Extracted price:', price, 'from productPrice:', params.productPrice, 'or MNT_AMOUNT:', params.MNT_AMOUNT);
    
    // Определяем план по MNT_CUSTOM1 (ID плана) или цене как резерв
    let plan = 'professional'; // по умолчанию professional
    const planId = params.MNT_CUSTOM1 as string;
    
    console.log('🎯 Plan determination:');
    console.log('  - MNT_CUSTOM1:', planId);
    console.log('  - Available params:', Object.keys(params));
    
    if (planId === '1') {
      plan = 'basic';
    } else if (planId === '2' || planId === '3') {
      plan = 'professional';
    } else {
      // Исправленная резервная логика по цене
      console.log('  - Using fallback price logic for price:', price);
      if (price <= 1) {
        plan = 'basic';  // Только очень маленькие суммы = basic
      } else {
        plan = 'professional';  // Все остальное = professional
      }
      console.log('  - Used fallback price logic');
    }
    
    console.log('  - Final plan:', plan);
    
    const planLimits = {
      free: 999,        // Безлимит для free
      basic: 999,       // Безлимит для basic  
      professional: 999 // Безлимит для professional
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits] || 999;
    
    console.log(`🎯 Processing payment: ${price} RUB for ${email}, plan: ${plan}, limit: ${checksLimit}, transactionId: ${finalTransactionId}`);

    if (!email) {
      console.error('❌ No email found in webhook data');
      return new Response('FAIL - No email', { status: 200 });
    }

    // Обновляем тариф пользователя напрямую через Supabase
    try {
      console.log('🔍 Searching for user by email:', email);
      
      // Находим пользователя по email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, user_id, email, name, phone, plan, checks_limit, checks_used')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found for email:', email, 'error:', userError);
        return new Response('FAIL - User not found', { status: 200 });
      }

      console.log('✅ User found:', {
        id: userData.id,
        user_id: userData.user_id,
        email: userData.email,
        currentPlan: userData.plan
      });

      // Обновляем план пользователя
      const userId = userData.user_id || userData.id;
      console.log('🔄 Updating plan for user:', userId);

      const { data: updatedData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          plan: plan,
          checks_limit: checksLimit,
          checks_used: 0, // Сбрасываем использованные проверки
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update by user_id, trying id field:', updateError);
        
        // Пробуем обновить по полю id
        const { data: retryData, error: retryError } = await supabase
          .from('user_profiles')
          .update({
            plan: plan,
            checks_limit: checksLimit,
            checks_used: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (retryError || !retryData) {
          console.error('❌ Failed to update plan via id field too:', retryError);
          return new Response('FAIL - Update failed', { status: 200 });
        }

        console.log('✅ Plan updated successfully via id field:', retryData);
      } else {
        console.log('✅ Plan updated successfully via user_id field:', updatedData);
      }

      // Сохраняем информацию о транзакции
      console.log('💾 Saving transaction to database');
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .upsert({
          transaction_id: finalTransactionId,
          user_id: userId,
          email: email,
          plan: plan,
          amount: price,
          status: 'completed',
          processed_at: new Date().toISOString()
        });
        
      if (transactionError) {
        console.error('❌ Error saving transaction:', transactionError);
      } else {
        console.log('✅ Transaction saved successfully');
      }

      console.log(`🎉 Payment processed successfully for ${email}: ${plan} plan (${checksLimit} checks)`);

    } catch (error) {
      console.error('💥 Error in webhook processing:', error);
      return new Response('FAIL - Processing error', { status: 200 });
    }
    
    // Возвращаем SUCCESS
    return new Response('SUCCESS', { status: 200 });

  } catch (error) {
    console.error('💥 Payment notification error:', error);
    return new Response('FAIL', { status: 200 });
  }
}

// Также поддерживаем GET для проверочных запросов
export async function GET(request: NextRequest) {
  return new Response('OK', { status: 200 });
}