'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveAuthToken } from '@/lib/storage';

function GoogleAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      // Default to /profile instead of / to avoid redirect chain
      const redirect = searchParams.get('redirect') || '/profile';

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
          
          // Normalize redirect path - if it's just '/', redirect to /profile
          const redirectPath = redirect === '/' ? '/profile' : redirect;
          
          // Redirect to the intended page
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

