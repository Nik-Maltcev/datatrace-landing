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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: { message: 'UserId is required' } },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to get profile' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, profile });

  } catch (error) {
    console.error('Get profile endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}