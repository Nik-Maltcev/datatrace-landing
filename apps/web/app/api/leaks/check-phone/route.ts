import { NextRequest, NextResponse } from 'next/server';

// Import services (we'll need to convert them to TypeScript later)
const SnusbaseService = require('@/lib/services/SnusbaseService');
const DeHashedService = require('@/lib/services/DeHashedService');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phone number is required'
          }
        },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const results = [];
    const errors = [];

    // Check Snusbase if configured
    if (process.env.SNUSBASE_API_KEY) {
      try {
        const snusbaseService = new SnusbaseService();
        const snusbaseResult = await snusbaseService.searchByPhone(normalizedPhone);
        
        if (snusbaseResult.ok && snusbaseResult.data) {
          results.push({
            source: 'Snusbase',
            found: snusbaseResult.data.length > 0,
            count: snusbaseResult.data.length,
            data: snusbaseResult.data
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
        const dehashedResult = await dehashedService.searchByPhone(normalizedPhone);
        
        if (dehashedResult.ok && dehashedResult.data) {
          results.push({
            source: 'DeHashed',
            found: dehashedResult.data.length > 0,
            count: dehashedResult.data.length,
            data: dehashedResult.data
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

    return NextResponse.json({
      ok: true,
      phone: normalizedPhone,
      totalLeaks,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: totalLeaks > 0 
        ? `Найдено ${totalLeaks} утечек по номеру телефона`
        : 'Утечек по данному номеру телефона не найдено'
    });

  } catch (error) {
    console.error('Check phone endpoint error:', error);
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