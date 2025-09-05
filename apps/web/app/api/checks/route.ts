import { NextRequest, NextResponse } from 'next/server';

interface CheckResult {
  id: string;
  type: 'phone' | 'email';
  query: string;
  date: string;
  status: 'completed' | 'failed';
  totalLeaks: number;
  foundSources: number;
  results: {
    name: string;
    found: boolean;
    count?: number;
    error?: string;
    data?: any;
    items?: any;
  }[];
}

const checksStorage = new Map<string, CheckResult[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, checkResult } = body;

    if (!userId || !checkResult) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId or checkResult' },
        { status: 400 }
      );
    }

    const userChecks = checksStorage.get(userId) || [];
    
    const newCheck: CheckResult = {
      id: Date.now().toString(),
      type: checkResult.type,
      query: checkResult.query,
      date: new Date().toISOString(),
      status: 'completed',
      totalLeaks: checkResult.totalLeaks || 0,
      foundSources: checkResult.foundSources || 0,
      results: checkResult.results || []
    };

    userChecks.unshift(newCheck);
    
    if (userChecks.length > 50) {
      userChecks.splice(50);
    }

    checksStorage.set(userId, userChecks);

    return NextResponse.json({
      ok: true,
      message: 'Check result saved successfully',
      checkId: newCheck.id
    });

  } catch (error: any) {
    console.error('Save check error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const userChecks = checksStorage.get(userId) || [];

    return NextResponse.json({
      ok: true,
      checks: userChecks
    });

  } catch (error: any) {
    console.error('Get checks error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}