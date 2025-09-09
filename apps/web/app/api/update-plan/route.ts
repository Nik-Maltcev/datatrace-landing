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

    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { ok: false, error: { message: 'UserId and plan are required' } },
        { status: 400 }
      );
    }

    const planLimits = {
      free: 0,
      basic: 1,
      professional: 2
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        plan,
        checks_limit: planLimits[plan as keyof typeof planLimits],
        checks_used: 0
      })
      .eq('id', userId);

    if (error) {
      console.error('Update plan error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to update plan' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Update plan endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}