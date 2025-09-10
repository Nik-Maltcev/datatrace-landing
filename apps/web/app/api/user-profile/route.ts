import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing userId' } },
        { status: 400 }
      );
    }

    console.log('Fetching profile for user ID:', userId);
    
    // Получаем профиль пользователя из Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .select('plan, checks_limit, checks_used')
      .eq('user_id', userId)
      .single();
      
    console.log('Profile data from DB:', data);
    console.log('Profile error:', error);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to fetch profile', details: error } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: data
    });

  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Failed to fetch user profile', details: error } },
      { status: 500 }
    );
  }
}