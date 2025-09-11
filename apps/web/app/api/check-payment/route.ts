import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { ok: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking payment status for transaction:', transactionId);

    // Ищем запись о платеже в таблице payment_transactions
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (transactionError) {
      console.log('Transaction not found or error:', transactionError);
      return NextResponse.json({
        ok: true,
        status: 'pending',
        message: 'Payment is being processed'
      });
    }

    if (transaction.status === 'completed') {
      // Получаем обновленные данные пользователя
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return NextResponse.json({
          ok: false,
          error: 'User profile not found'
        }, { status: 404 });
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
    console.error('Check payment error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
