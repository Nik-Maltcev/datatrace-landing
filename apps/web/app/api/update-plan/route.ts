import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing userId or plan' } },
        { status: 400 }
      );
    }

    // Определяем лимиты по тарифу
    const planLimits = {
      basic: 1,
      professional: 2
    };

    const checksLimit = planLimits[plan as keyof typeof planLimits] || 1;

    // Обновляем пользователя в Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        plan: plan,
        checks_limit: checksLimit,
        checks_used: 0 // Сбрасываем использованные проверки
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Database update failed', details: error } },
        { status: 500 }
      );
    }

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