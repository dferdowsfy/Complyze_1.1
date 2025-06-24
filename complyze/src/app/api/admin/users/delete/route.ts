import { NextRequest, NextResponse } from 'next/server';
import { supabase, isAdmin } from '@/lib/supabaseClient';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, adminUserId } = body;

    // Validate required fields
    if (!userId || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, adminUserId' },
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
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user to be deleted first (for logging)
    const { data: userToDelete, error: getUserError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single();

    if (getUserError || !userToDelete) {
      return NextResponse.json(
        { error: 'User to delete not found' },
        { status: 404 }
      );
    }

    // Prevent deleting other super admins (extra protection)
    if (userToDelete.role === 'super_admin' && adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    // Delete the user from the public.users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user: ' + deleteError.message },
        { status: 500 }
      );
    }

    // Log the action
    console.log(`Admin ${adminUser.email} deleted user ${userToDelete.email} (${userId})`);

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.email} has been deleted successfully`,
      deletedUser: {
        id: userId,
        email: userToDelete.email,
        role: userToDelete.role
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 