import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/server/supabase-client';
import { resolvePlanFromParam } from '@/lib/plans';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('[update-plan] Supabase credentials are missing');
    return NextResponse.json(
      { ok: false, error: { message: 'Supabase is not configured' } },
      { status: 503 }
    );
  }


  try {
    const { userId, plan } = await request.json();

    console.log('Update plan request:', { userId, plan });

    if (!userId || !plan) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing userId or plan' } },
        { status: 400 }
      );
    }

    const { plan: normalizedPlan, limit: checksLimit } = resolvePlanFromParam(plan);

    console.log(`Updating user ${userId} to plan ${normalizedPlan} with limit ${checksLimit}`);

    // Обновляем пользователя в Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        plan: normalizedPlan,
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
          plan: normalizedPlan,
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