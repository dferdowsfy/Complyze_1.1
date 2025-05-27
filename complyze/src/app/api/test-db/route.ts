import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');

    // Test 1: Check if users table exists
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    console.log('Users table test:', { data: usersTest, error: usersError?.message });

    // Test 2: Check if projects table exists
    const { data: projectsTest, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);

    console.log('Projects table test:', { data: projectsTest, error: projectsError?.message });

    // Test 3: Check if prompt_logs table exists
    const { data: promptLogsTest, error: promptLogsError } = await supabase
      .from('prompt_logs')
      .select('count')
      .limit(1);

    console.log('Prompt logs table test:', { data: promptLogsTest, error: promptLogsError?.message });

    return NextResponse.json({
      success: true,
      tests: {
        users: { success: !usersError, error: usersError?.message },
        projects: { success: !projectsError, error: projectsError?.message },
        prompt_logs: { success: !promptLogsError, error: promptLogsError?.message }
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error },
      { status: 500 }
    );
  }
} 