import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/server/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    if (!client) {
      console.warn('[check-payment] Supabase credentials are not configured');
      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase credentials are missing – please contact support.'
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { ok: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    console.log('[check-payment] Checking status for transaction', transactionId);

    const { data: transaction, error: transactionError } = await client
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (transactionError) {
      console.log('[check-payment] Transaction not found:', transactionError);
      return NextResponse.json({
        ok: true,
        status: 'pending',
        message: 'Payment is being processed'
      });
    }

    if (transaction.status === 'completed') {
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (profileError) {
        console.error('[check-payment] Error fetching user profile:', profileError);
        return NextResponse.json(
          { ok: false, error: 'User profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        status: 'completed',
        profile: {
          id: userProfile.user_id || userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          phone: userProfile.phone,
          plan: userProfile.plan,
          checksUsed: userProfile.checks_used || 0,
          checksLimit: userProfile.checks_limit || 0
        }
      });
    }

    return NextResponse.json({
      ok: true,
      status: transaction.status || 'pending',
      message: 'Payment is being processed'
    });
  } catch (error) {
    console.error('[check-payment] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
