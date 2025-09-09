import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not available');
      return NextResponse.json(
        { ok: false, error: { message: 'Database not configured' } },
        { status: 503 }
      );
    }

    const { userId, plan } = await request.json();
    console.log('Received update plan request:', { userId, plan });

    if (!userId || !plan) {
      console.error('Missing required fields:', { userId: !!userId, plan: !!plan });
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

    const checksLimit = planLimits[plan as keyof typeof planLimits];
    console.log('Updating user plan:', { userId, plan, checksLimit });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan,
        checks_limit: checksLimit,
        checks_used: 0
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Update plan error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to update plan', details: error } },
        { status: 500 }
      );
    }

    console.log('Plan updated successfully:', data);
    return NextResponse.json({ ok: true, data });

  } catch (error) {
    console.error('Update plan endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}