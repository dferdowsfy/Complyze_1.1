import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface SignupRequestBody {
  email: string;
  password: string;
  full_name?: string;
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
    const body = await request.json() as SignupRequestBody;
    const { email, password, full_name } = body;

    console.log('Complyze API: Signup attempt for:', email);

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // First, check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(user => user.email === email);
    
    if (userExists) {
      console.log('Complyze API: User already exists:', email);
      return NextResponse.json({ 
        error: 'An account with this email already exists. Please try logging in.' 
      }, { status: 400 });
    }

    // Create user with Supabase Auth using admin API to bypass email confirmation
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark email as confirmed immediately
      user_metadata: {
        full_name: full_name || null
      }
    });

    console.log('Complyze API: Admin signup result:', {
      user: signupData?.user?.id,
      emailConfirmed: signupData?.user?.email_confirmed_at,
      error: signupError?.message
    });

    if (signupError) {
      console.error('Complyze API: Signup error:', signupError);
      return NextResponse.json({ 
        error: 'Signup failed',
        details: signupError.message
      }, { status: 400 });
    }

    if (!signupData.user) {
      console.error('Complyze API: No user created');
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 400 });
    }

    // Create user profile in our users table
    console.log('Complyze API: Creating user profile');
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: signupData.user.id,
        email: signupData.user.email || email,
        full_name: full_name || null,
        plan: 'free'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Complyze API: Failed to create user profile:', profileError);
      // If profile creation fails, we should still continue since the auth user was created
    } else {
      console.log('Complyze API: User profile created successfully');
    }

    // Create default project
    const { data: defaultProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Default Project',
        description: 'Your default Complyze project',
        user_id: signupData.user.id
      })
      .select()
      .single();

    if (projectError) {
      console.error('Complyze API: Failed to create default project:', projectError);
    } else {
      console.log('Complyze API: Default project created');
    }

    // Now try to sign in the user to get an active session
    console.log('Complyze API: Attempting immediate login after signup');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Complyze API: Immediate login result:', {
      session: !!loginData?.session,
      error: loginError?.message
    });

    if (loginData.session && !loginError) {
      // Auto-login successful
      return NextResponse.json({
        success: true,
        message: 'Account created and logged in successfully',
        user: {
          id: signupData.user.id,
          email: signupData.user.email,
          full_name: full_name || null,
          plan: userProfile?.plan || 'free'
        },
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token,
        auto_login: true
      });
    } else {
      console.log('Complyze API: Auto-login failed, but account created successfully');
      
      // Account created but auto-login failed - user should be able to login manually
      return NextResponse.json({
        success: true,
        message: 'Account created successfully! You can now log in with your credentials.',
        user: {
          id: signupData.user.id,
          email: signupData.user.email,
          full_name: full_name || null,
          plan: userProfile?.plan || 'free'
        },
        auto_login: false
      });
    }

  } catch (error) {
    console.error('Complyze API: Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed. Please try again.' },
      { status: 500 }
    );
  }
} 