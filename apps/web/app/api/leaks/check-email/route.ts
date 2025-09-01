import { NextRequest, NextResponse } from 'next/server';

// Import services (we'll need to convert them to TypeScript later)
const SnusbaseService = require('@/lib/services/SnusbaseService');
const DeHashedService = require('@/lib/services/DeHashedService');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        },
        { status: 400 }
      );
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    
    const results = [];
    const errors = [];

    // Check Snusbase if configured
    if (process.env.SNUSBASE_API_KEY) {
      try {
        const snusbaseService = new SnusbaseService();
        const snusbaseResult = await snusbaseService.searchByEmail(normalizedEmail);
        
        if (snusbaseResult.ok && snusbaseResult.data) {
          results.push({
            source: 'Snusbase',
            found: snusbaseResult.data.length > 0,
            count: snusbaseResult.data.length,
            data: snusbaseResult.data.map((item: any) => ({
              ...item,
              // Hide sensitive data in response
              password: item.password ? '***' : undefined,
              hash: item.hash ? '***' : undefined
            }))
          });
        }
      } catch (error) {
        console.error('Snusbase search error:', error);
        errors.push({
          source: 'Snusbase',
          error: 'Failed to search Snusbase'
        });
      }
    }

    // Check DeHashed if configured
    if (process.env.DEHASHED_API_KEY && process.env.DEHASHED_EMAIL) {
      try {
        const dehashedService = new DeHashedService();
        const dehashedResult = await dehashedService.searchByEmail(normalizedEmail);
        
        if (dehashedResult.ok && dehashedResult.data) {
          results.push({
            source: 'DeHashed',
            found: dehashedResult.data.length > 0,
            count: dehashedResult.data.length,
            data: dehashedResult.data.map((item: any) => ({
              ...item,
              // Hide sensitive data in response
              password: item.password ? '***' : undefined,
              hashed_password: item.hashed_password ? '***' : undefined
            }))
          });
        }
      } catch (error) {
        console.error('DeHashed search error:', error);
        errors.push({
          source: 'DeHashed',
          error: 'Failed to search DeHashed'
        });
      }
    }

    // Calculate total leaks found
    const totalLeaks = results.reduce((sum, result) => sum + (result.count || 0), 0);

    // Prepare breach summary
    const breachSummary = results
      .filter(r => r.found)
      .map(r => ({
        source: r.source,
        count: r.count,
        databases: [...new Set(r.data.map((d: any) => d.database || d.source_name).filter(Boolean))]
      }));

    return NextResponse.json({
      ok: true,
      email: normalizedEmail,
      totalLeaks,
      results,
      breachSummary,
      errors: errors.length > 0 ? errors : undefined,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по email адресу`
        : 'Утечек по данному email адресу не найдено'
    });

  } catch (error) {
    console.error('Check email endpoint error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}