import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing email' } },
        { status: 400 }
      );
    }

    // Ищем пользователя по email в Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, phone, plan, checks_limit, checks_used')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'User not found', details: error } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: data
    });

  } catch (error) {
    console.error('Find user error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Failed to find user', details: error } },
      { status: 500 }
    );
  }
}