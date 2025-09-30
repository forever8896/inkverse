'use client';

import { useEffect } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
        // Redirect after successful logout
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Signing Out...
            </h1>
            <p className="text-gray-300">
              Please wait while we log you out securely.
            </p>
          </div>

          {session?.user && (
            <div className="mb-4 p-3 bg-black/20 rounded-lg">
              <p className="text-sm text-gray-300">
                Signing out: <span className="text-purple-300">{session.user.name}</span>
              </p>
            </div>
          )}

          <div className="text-xs text-gray-400">
            You'll be redirected to the home page shortly...
          </div>
        </div>

        <div className="max-w-md mx-auto mt-6 text-center">
          <a
            href="/"
            className="text-purple-300 hover:text-purple-100 text-sm underline"
          >
            ← Return to Home Manually
          </a>
        </div>
      </div>
    </div>
  );
}