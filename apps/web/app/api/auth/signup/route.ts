import { NextRequest    const body = await request.json();
    const { email, password, name, phone, captchaToken, ...additionalData } = body;

    // Validation
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, name, and phone are required'
          }
        },
        { status: 400 }
      );
    }

    // Validate captcha token
    if (!captchaToken) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please complete the captcha verification'
          }
        },
        { status: 400 }
      );
    } from 'next/server';
import { getSupabaseClient } from '@/lib/config/supabase-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'Authentication service not configured'
          }
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, captchaToken, ...additionalData } = body;

    // Validation
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, name, and phone are required'
          }
        },
        { status: 400 }
      );
    }

    // Captcha validation
    if (!captchaToken) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Captcha verification is required'
          }
        },
        { status: 400 }
      );
    }

    // Email validation
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

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 6 characters long'
          }
        },
        { status: 400 }
      );
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        captchaToken,
        data: {
          name: name.trim(),
          phone: phone.trim(),
          ...additionalData
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'AUTH_ERROR',
            message: error.message || 'Registration failed'
          }
        },
        { status: 400 }
      );
    }

    // Profile will be created automatically by Supabase trigger

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata,
        created_at: data.user?.created_at
      },
      message: 'Проверьте email для подтверждения регистрации'
    });

  } catch (error) {
    console.error('Signup endpoint error:', error);
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