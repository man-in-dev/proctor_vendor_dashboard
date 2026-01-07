'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveAuthToken } from '@/lib/storage';
import { getCurrentUser } from '@/lib/api';

function GoogleAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      // Default to /profile instead of / to avoid redirect chain
      const redirect = searchParams.get('redirect') || '/profile';
      const phoneFromQuery = searchParams.get('phone');

      if (error) {
        // Redirect to login with error
        router.push('/login?error=oauth_failed');
        return;
      }

      if (token) {
        try {
          // Store token synchronously
          saveAuthToken(token);
          
          // Small delay to ensure token is saved before navigation
          // This prevents race conditions with ProtectedRoute checks
          await new Promise(resolve => setTimeout(resolve, 100));

          // Decide where to redirect and optionally save phone
          let redirectPath = redirect === '/' ? '/profile' : redirect;
          try {
            const currentUser = await getCurrentUser(token);

            // If we got phone from the initial form and user doesn't have one yet, save it
            if (!currentUser.phone && phoneFromQuery) {
              try {
                await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ phone: phoneFromQuery }),
                  }
                );
              } catch (patchErr) {
                console.error('Failed to update phone after Google OAuth:', patchErr);
              }
            }
          } catch (e) {
            // If /me fails, fall back to original redirect
            console.error('Failed to fetch current user after Google OAuth:', e);
          }

          // Redirect to the intended page or phone capture
          router.push(redirectPath);
        } catch (err) {
          console.error('Error storing token:', err);
          router.push('/login?error=oauth_failed');
        }
      } else {
        // No token received, redirect to login
        router.push('/login?error=oauth_failed');
      }
    };

    handleAuthSuccess();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </main>
  );
}

export default function GoogleAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <GoogleAuthSuccessContent />
    </Suspense>
  );
}

