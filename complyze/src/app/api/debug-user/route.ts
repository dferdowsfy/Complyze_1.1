import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No valid authorization header'
      }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ 
        error: 'Invalid token'
      }, { status: 401 });
    }

    // Check if user has any prompt events
    const { data: promptEvents, error: eventsError } = await supabase
      .from('prompt_events')
      .select('id, captured_at, risk_level, model, usd_cost')
      .eq('user_id', user.id)
      .limit(10);

    // Count total events
    const { count, error: countError } = await supabase
      .from('prompt_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
      },
      prompt_events: {
        total_count: count || 0,
        recent_events: promptEvents || [],
        error: eventsError?.message
      }
    });
    
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { 
        error: 'Debug check failed' 
      },
      { status: 500 }
    );
  }
} 