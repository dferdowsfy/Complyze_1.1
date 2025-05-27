import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'No valid authorization header'
      }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // User exists in auth but not in our users table - create profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json({ 
          authenticated: false,
          error: 'Failed to create user profile'
        }, { status: 500 });
      }

      return NextResponse.json({ 
        authenticated: true,
        user: {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          plan: newProfile.plan || 'free'
        }
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        plan: userProfile.plan || 'free'
      }
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Authentication check failed' 
      },
      { status: 500 }
    );
  }
}

// For extension compatibility, also support simple GET without auth header
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'No user ID provided'
      }, { status: 401 });
    }

    // Check if user exists in our database
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'User not found'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        plan: userProfile.plan || 'free'
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Authentication check failed' 
      },
      { status: 500 }
    );
  }
} 