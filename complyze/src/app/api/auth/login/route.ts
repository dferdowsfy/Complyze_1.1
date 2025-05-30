import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequestBody;
    const { email, password } = body;

    console.log('Complyze API: Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Complyze API: Login result:', {
      user: data?.user?.id,
      session: !!data?.session,
      emailConfirmed: data?.user?.email_confirmed_at,
      error: error?.message
    });

    if (error) {
      console.error('Complyze API: Login error:', error);
      return NextResponse.json({ 
        error: 'Invalid credentials or account not verified',
        details: error.message
      }, { status: 401 });
    }

    if (!data.user || !data.session) {
      console.error('Complyze API: No user or session returned');
      return NextResponse.json({ 
        error: 'Authentication failed' 
      }, { status: 401 });
    }

    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      console.error('Complyze API: Email not confirmed for user:', email);
      return NextResponse.json({ 
        error: 'Please verify your email address before logging in' 
      }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    console.log('Complyze API: Profile lookup result:', {
      profile: !!userProfile,
      error: profileError?.message
    });

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || null,
          plan: 'free'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json({ 
          error: 'Failed to create user profile' 
        }, { status: 500 });
      }

      console.log('Complyze API: Profile created during login');
      return NextResponse.json({
        success: true,
        user: {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          plan: newProfile.plan || 'free'
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }

    console.log('Complyze API: Login successful for user:', email);
    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        plan: userProfile.plan || 'free'
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
} 