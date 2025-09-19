import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, plan } = await request.json();

    console.log('Update plan request:', { userId, plan });

    if (!userId || !plan) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing userId or plan' } },
        { status: 400 }
      );
    }

    // Определяем лимиты по тарифу - теперь все безлимитные
    const planLimits = {
      free: 999,
      basic: 999,
      professional: 999
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits] || 999;

    console.log(`Updating user ${userId} to plan ${plan} with limit ${checksLimit}`);

    // Обновляем пользователя в Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        plan: plan,
        checks_limit: checksLimit,
        checks_used: 0 // Сбрасываем использованные проверки
      })
      .eq('user_id', userId)
      .select();

    console.log('Supabase update result:', { data, error });

    if (error) {
      console.error('Supabase error details:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Database update failed', details: error } },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No rows updated. User not found or user_id field mismatch');
      // Попробуем найти пользователя по id вместо user_id
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .update({
          plan: plan,
          checks_limit: checksLimit,
          checks_used: 0
        })
        .eq('id', userId)
        .select();

      console.log('Retry with id field:', { userData, userError });

      if (userError || !userData || userData.length === 0) {
        return NextResponse.json(
          { ok: false, error: { message: 'User not found for update', details: { userError, userId } } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'Plan updated successfully (via id field)',
        data: userData?.[0]
      });
    }

    console.log('Plan updated successfully:', data?.[0]);

    return NextResponse.json({
      ok: true,
      message: 'Plan updated successfully',
      data: data?.[0]
    });

  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Failed to update plan', details: error } },
      { status: 500 }
    );
  }
}