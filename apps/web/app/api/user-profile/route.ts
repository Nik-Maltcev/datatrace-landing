import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: { message: 'Database not configured' } },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { ok: false, error: { message: 'UserId or email is required' } },
        { status: 400 }
      );
    }

    let query = supabase.from('user_profiles').select('*');
    
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: profile, error } = await query.single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      ok: true, 
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        plan: profile.plan || 'free',
        checksUsed: profile.checks_used || 0,
        checksLimit: profile.checks_limit || 0
      }
    });

  } catch (error) {
    console.error('User profile endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}