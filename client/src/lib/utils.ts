import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiRequest } from "./queryClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debug functions for development only
 */
export async function getTestUserData() {
  try {
    const response = await fetch('/api/debug/test-user');
    if (!response.ok) {
      throw new Error('Failed to get test user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting test user:', error);
    return null;
  }
}

export async function loginAsTestUser() {
  try {
    const response = await apiRequest({
      url: '/api/debug/login-test-user',
      method: 'POST'
    });
    return response?.user;
  } catch (error) {
    console.error('Error logging in as test user:', error);
    return null;
  }
}
