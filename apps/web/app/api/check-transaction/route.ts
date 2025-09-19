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

    const { transactionId, email } = await request.json();

    if (!transactionId || !email) {
      return NextResponse.json(
        { ok: false, error: { message: 'Transaction ID and email are required' } },
        { status: 400 }
      );
    }

    console.log(`Checking transaction ${transactionId} for ${email}`);

    // Проверяем существует ли транзакция в базе
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('email', email)
      .eq('status', 'completed')
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { ok: false, error: { message: 'Transaction not found or not completed' } },
        { status: 404 }
      );
    }

    // Если транзакция найдена, обновляем план пользователя
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        plan: transaction.plan,
        checks_limit: 999,  // Безлимит для всех планов
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json(
        { ok: false, error: { message: 'Failed to update user plan' } },
        { status: 500 }
      );
    }

    console.log(`Plan updated for ${email} to ${transaction.plan}`);

    return NextResponse.json({ 
      ok: true, 
      message: 'Plan updated successfully',
      plan: transaction.plan,
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        plan: updatedProfile.plan,
        checksUsed: updatedProfile.checks_used || 0,
        checksLimit: updatedProfile.checks_limit || 0
      }
    });

  } catch (error) {
    console.error('Check transaction error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}