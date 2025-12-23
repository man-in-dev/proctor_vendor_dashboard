/**
 * Local storage utilities for auth
 */

const STORAGE_KEY_AUTH_TOKEN = 'auth_token';

export function saveAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  } catch (error) {
    console.error('Error loading auth token:', error);
    return null;
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

