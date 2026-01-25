import apiClient from '@/lib/api-client';
import type { User } from '@/types/assessment';

/**
 * Users Service
 * API endpoints for user management
 */

/**
 * GET /api/users
 * Fetch all users, optionally including inactive users
 */
export const getUsers = async (includeInactive: boolean = false): Promise<User[]> => {
  try {
    const params = new URLSearchParams();
    if (includeInactive) params.append('include_inactive', 'true');

    const url = `/api/users${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<User[]>(url);
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to load users. Please try again.');
  }
};

/**
 * POST /api/users
 * Create a new user
 */
export const createUser = async (userData: {
  email: string;
  full_name: string;
  role_title: string;
  school_id?: string | null;
  mat_id?: string;
}): Promise<User> => {
  try {
    const response = await apiClient.post<User>('/api/users', userData);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create user:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to add user. Please try again.';
    throw new Error(errorMessage);
  }
};

/**
 * DELETE /api/users/{user_id}
 * Soft delete a user (set is_active = false)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/users/${userId}`);
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to deactivate user. Please try again.';
    throw new Error(errorMessage);
  }
};
