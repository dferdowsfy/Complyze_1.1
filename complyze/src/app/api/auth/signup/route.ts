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

    // Create user with Supabase Auth
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || null
        },
        emailRedirectTo: undefined // Disable email confirmation for development
      }
    });

    console.log('Complyze API: Supabase signup result:', {
      user: signupData?.user?.id,
      session: !!signupData?.session,
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

    // Always try to sign in immediately after signup (for development)
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
      // Wait a moment for the database trigger to create the user profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      console.log('Complyze API: User profile lookup after immediate login:', {
        profile: !!userProfile,
        error: profileError?.message
      });

      // If profile doesn't exist, create it manually
      if (!userProfile && profileError) {
        console.log('Complyze API: Creating user profile manually');
        
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: loginData.user.id,
            email: loginData.user.email || email,
            full_name: full_name || null,
            plan: 'free'
          })
          .select()
          .single();

        if (createError) {
          console.error('Complyze API: Failed to create user profile:', createError);
        } else {
          console.log('Complyze API: User profile created manually');
        }

        // Also create default project
        const { data: defaultProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: 'Default Project',
            description: 'Your default Complyze project',
            user_id: loginData.user.id
          })
          .select()
          .single();

        if (projectError) {
          console.error('Complyze API: Failed to create default project:', projectError);
        } else {
          console.log('Complyze API: Default project created');
        }
      }

      return NextResponse.json({
        success: true,
        message: 'User created and logged in successfully',
        user: {
          id: loginData.user.id,
          email: loginData.user.email,
          full_name: full_name || null,
          plan: userProfile?.plan || 'free'
        },
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token,
        auto_login: true
      });
    } else {
      console.log('Complyze API: Immediate login failed, email confirmation may be required');
      
      // Email confirmation required
      return NextResponse.json({
        success: true,
        message: 'User created successfully. Please check your email for verification, then try logging in.',
        user: {
          id: signupData.user.id,
          email: signupData.user.email,
          full_name: full_name || null
        },
        email_confirmation_sent: true,
        auto_login: false
      });
    }

  } catch (error) {
    console.error('Complyze API: Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
} 