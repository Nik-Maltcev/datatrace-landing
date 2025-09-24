import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/server/supabase-client';
import { resolvePlanFromParam } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: { message: 'Database not configured' } },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, plan: planParam, amount } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    const { plan, limit: checksLimit, rawPlan } = resolvePlanFromParam(planParam);

    console.log(`✅ Plan mapped: ${planParam} → ${plan} (limit: ${checksLimit})`);

    // Обновляем профиль пользователя
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        plan,
        checks_limit: checksLimit,
        checks_used: 0,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Payment success update error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to update user plan' } },
        { status: 500 }
      );
    }

    console.log(`Payment successful for ${email}: plan ${plan}, limit ${checksLimit}`);

    return NextResponse.json({ 
      ok: true, 
      message: 'Plan updated successfully',
      profile: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        plan: data.plan,
        rawPlan,
        checksUsed: data.checks_used || 0,
        checksLimit: data.checks_limit || 0
      }
    });

  } catch (error) {
    console.error('Payment success endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}