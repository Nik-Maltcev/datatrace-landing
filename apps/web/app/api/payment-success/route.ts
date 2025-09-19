import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';

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

    // Определяем план и лимит проверок по plan
    let plan: string;
    let checksLimit: number;

    console.log('🎯 Payment success processing plan:', planParam);

    switch (planParam) {
      case 'basic':
        plan = 'basic';
        checksLimit = 1;
        break;
      case 'professional':
      case 'professional-6m':
      case 'professional-12m':
        plan = 'professional';
        checksLimit = 2;
        break;
      default:
        // Fallback: если план не распознан, делаем professional
        console.log('⚠️ Unknown plan, defaulting to professional:', planParam);
        plan = 'professional';
        checksLimit = 2;
        break;
    }

    console.log(`✅ Plan mapped: ${planParam} → ${plan} (limit: ${checksLimit})`);

    // Обновляем профиль пользователя
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        plan,
        checks_limit: checksLimit,
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