import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';
import { resolvePlanFromParam } from '@/lib/plans';

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
    const userIdParam = searchParams.get('user_id'); // Добавляем поддержку user_id

    if (!userId && !email && !userIdParam) {
      return NextResponse.json(
        { ok: false, error: { message: 'UserId, user_id, or email is required' } },
        { status: 400 }
      );
    }

    let query = supabase.from('user_profiles').select('*');
    
    if (userId) {
      query = query.eq('id', userId);
    } else if (userIdParam) {
      query = query.eq('user_id', userIdParam);
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

    const { plan: normalizedPlan, rawPlan } = resolvePlanFromParam(profile.plan);

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        plan: normalizedPlan,
        rawPlan,
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
    const { userId, email, plan, checksLimit } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { ok: false, error: { message: 'UserId or email is required' } },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { ok: false, error: { message: 'Plan is required' } },
        { status: 400 }
      );
    }

    // Определяем лимит проверок в зависимости от плана
    const resolvedPlan = resolvePlanFromParam(plan);
    const { plan: normalizedPlan, limit: defaultLimit } = resolvedPlan;
    const finalChecksLimit = checksLimit ?? defaultLimit;

    let query = supabase
      .from('user_profiles')
      .update({
        plan: normalizedPlan,
        checks_limit: finalChecksLimit,
        checks_used: 0,
        updated_at: new Date().toISOString()
      });
    
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to update profile' } },
        { status: 500 }
      );
    }

    const { plan: updatedPlan, rawPlan } = resolvePlanFromParam(data.plan);
    const effectiveChecksLimit = data.checks_limit ?? finalChecksLimit ?? 0;

    return NextResponse.json({
      ok: true,
      profile: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        plan: updatedPlan,
        rawPlan,
        checksUsed: data.checks_used || 0,
        checksLimit: effectiveChecksLimit
      }
    });

  } catch (error) {
    console.error('User profile update error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}