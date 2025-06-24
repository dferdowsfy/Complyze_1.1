import { NextRequest, NextResponse } from 'next/server';
import { supabase, isAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, adminUserId } = body;

    // Validate required fields
    if (!userId || !role || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role, adminUserId' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: user, admin, super_admin' },
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

    // Prevent admins from changing their own role (safety measure)
    if (userId === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Update the user's role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, full_name, plan, role, created_at')
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    console.log(`Admin ${adminUser.email} updated user ${targetUser.email} role from ${targetUser.role} to ${role}`);

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in /api/admin/users/update-role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 