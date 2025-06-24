import { NextRequest, NextResponse } from 'next/server';
import { supabase, isAdmin } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get admin user ID from query params
    const url = new URL(request.url);
    const adminUserId = url.searchParams.get('adminUserId');
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID required' },
        { status: 400 }
      );
    }

    // Verify the requesting user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, plan, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      total: users?.length || 0
    });

  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 