'use client';

import { useSession, signIn, signOut } from '@/lib/auth-client';

export default function AuthTestPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            GitHub OAuth Test
          </h1>

          {session?.user ? (
            <div className="text-center">
              <div className="mb-4">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-16 h-16 rounded-full mx-auto mb-2"
                  />
                )}
                <h2 className="text-xl font-semibold text-white">
                  Welcome, {session.user.name}!
                </h2>
                <p className="text-gray-300 text-sm">{session.user.email}</p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 mb-4 text-left">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">Session Data:</h3>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => signOut()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sign Out (Quick)
                </button>
                
                <a
                  href="/logout"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors block text-center"
                >
                  Go to Logout Page
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-300 mb-6">
                Please sign in with GitHub to test the authentication.
              </p>

              <button
                onClick={() => signIn.social({ provider: 'github', callbackURL: '/auth-test' })}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Sign in with GitHub
              </button>

              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-200">
                  <strong>Test Info:</strong><br/>
                  This will redirect to GitHub OAuth, then back to this page.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto mt-6 text-center">
          <a
            href="/"
            className="text-purple-300 hover:text-purple-100 text-sm underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}