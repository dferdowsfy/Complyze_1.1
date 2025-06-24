'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types
interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

// Authentication hook
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('complyze_token');
      const userData = localStorage.getItem('complyze_user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Check if user is admin
          const isAdmin = parsedUser.role === 'admin' || 
                          parsedUser.role === 'super_admin' || 
                          parsedUser.plan === 'enterprise';
          
          if (!isAdmin) {
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('complyze_token');
          localStorage.removeItem('complyze_user');
          router.push('/');
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, user, loading };
}

export default function AdminPanel() {
  const { isAuthenticated, user, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{userId: string, email: string} | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element)?.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users?adminUserId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUser(userId);
      setError(null);
      
      const response = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
          adminUserId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // Refresh the users list
      await fetchUsers();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'User role updated successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingUser(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(userId);
      setError(null);
      
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          adminUserId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const result = await response.json();
      
      // Refresh the users list
      await fetchUsers();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = result.message || 'User deleted successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingUser(null);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteClick = (userId: string, email: string) => {
    setDeleteConfirm({ userId, email });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteUser(deleteConfirm.userId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E1E36]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0E1E36]">
      {/* Navigation */}
      <nav className="flex flex-col sm:flex-row items-center justify-between py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto gap-4 sm:gap-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-6 sm:gap-12 min-w-[180px] w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xl sm:text-2xl font-light tracking-widest uppercase text-white select-none" style={{ letterSpacing: 2 }}>COMPLYZE</span>
          {/* Mobile menu toggle could go here if needed */}
        </div>
        
        {/* Center: Navigation Links */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-8 lg:gap-12 items-center justify-center w-full sm:w-auto mt-3 sm:mt-0">
          <Link href="/dashboard" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Dashboard
          </Link>
          <Link href="/dashboard/reports" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Reports
          </Link>
          <Link href="/dashboard/settings" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Settings
          </Link>
          <Link href="/dashboard/admin" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Admin
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          </Link>
        </div>
        
        {/* Right: User Info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-[120px] sm:min-w-[160px] justify-end w-full sm:w-auto mt-3 sm:mt-0">
          {user?.email && (
            <div className="relative user-dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="rounded-full bg-white/10 px-3 sm:px-4 py-1 text-white font-medium truncate max-w-[120px] sm:max-w-[140px] cursor-pointer transition-all duration-200 hover:bg-white/20 text-sm sm:text-base flex items-center gap-2"
                title={user.email}
              >
                <span style={{ display: 'inline-block' }}>
                  {user.full_name || user.email}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[160px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('complyze_token');
                      localStorage.removeItem('complyze_user');
                      window.location.href = '/';
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="bg-[#FF6F3C] text-white px-4 py-2 rounded-lg hover:bg-[#e55a2b] transition disabled:opacity-50"
            >
              {loadingUsers ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading users...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Email</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Name</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Plan</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Role</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Joined</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-gray-900">{u.email}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-900">{u.full_name || 'N/A'}</td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(u.plan)}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              disabled={updatingUser === u.id || u.id === user.id}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6F3C] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                            {updatingUser === u.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF6F3C]"></div>
                            )}
                          </div>
                          
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteClick(u.id, u.email)}
                              disabled={deletingUser === u.id || updatingUser === u.id}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {deletingUser === u.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  🗑️ Delete
                                </>
                              )}
                            </button>
                          )}
                          
                          {u.id === user.id && (
                            <div className="text-xs text-gray-500">
                              (You - Cannot delete)
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm User Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the user <strong>{deleteConfirm.email}</strong>? 
              This action cannot be undone and will permanently remove the user from the system.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingUser === deleteConfirm.userId}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deletingUser === deleteConfirm.userId ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 