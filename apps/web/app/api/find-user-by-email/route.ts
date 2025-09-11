import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('Find user by email request:', email);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: { message: 'Missing email' } },
        { status: 400 }
      );
    }

    // Ищем пользователя по email в Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, name, phone, plan, checks_limit, checks_used')
      .eq('email', email)
      .single();

    console.log('User search result:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'User not found', details: error } },
        { status: 404 }
      );
    }

    // Возвращаем пользователя с правильным ID (приоритет user_id, потом id)
    const userId = data.user_id || data.id;
    console.log('Returning user with ID:', userId);

    return NextResponse.json({
      ok: true,
      user: {
        ...data,
        id: userId // Убеждаемся, что ID корректный
      }
    });

  } catch (error) {
    console.error('Find user error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Failed to find user', details: error } },
      { status: 500 }
    );
  }
}