import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Простая проверка доступа (можно улучшить)
    const { adminKey } = await request.json();
    if (adminKey !== 'datatrace-admin-2025') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting bulk update to unlimited plans...');

    // Обновляем всех пользователей на безлимитные тарифы
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        checks_limit: 999,
        checks_used: 0,  // Сбрасываем использованные проверки
        updated_at: new Date().toISOString()
      })
      .lt('checks_limit', 999)  // Только тех, у кого лимит меньше 999
      .select('email, plan, checks_limit');

    if (error) {
      console.error('❌ Bulk update error:', error);
      return NextResponse.json(
        { ok: false, error: 'Database update failed', details: error },
        { status: 500 }
      );
    }

    console.log(`✅ Updated ${data?.length || 0} users to unlimited plans`);

    return NextResponse.json({
      ok: true,
      message: `Successfully updated ${data?.length || 0} users to unlimited plans`,
      updatedUsers: data?.length || 0,
      users: data
    });

  } catch (error) {
    console.error('💥 Bulk update error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}