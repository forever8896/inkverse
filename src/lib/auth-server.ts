/**
 * Server-side authentication utilities for Better Auth
 *
 * This module provides server-side session validation and protection
 * utilities for Next.js API routes and Server Components.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, type Session, type User } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthSession {
  user: User;
  session: Session;
}

/**
 * Get the current session from server-side context
 * Works in Server Components, API Routes, and Middleware
 */
export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user || !session?.session) {
      return null;
    }

    return session as unknown as AuthSession;
  } catch (error) {
    console.error('[Auth] Failed to get server session:', error);
    return null;
  }
}

/**
 * Get session from API route request
 * Use this in API routes where you have access to NextRequest
 */
export async function getSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session?.session) {
      return null;
    }

    return session as unknown as AuthSession;
  } catch (error) {
    console.error('[Auth] Failed to get session from request:', error);
    return null;
  }
}

/**
 * Require authentication in Server Components
 * Redirects to login page if not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth-test?error=authentication_required');
  }

  return session;
}

/**
 * Higher-order function to protect API routes
 * Returns 401 if not authenticated
 */
export function withAuth<T extends any[]>(
  handler: (session: AuthSession, ...args: T) => Promise<Response | NextResponse>
) {
  return async (...args: T): Promise<Response | NextResponse> => {
    // Assume first argument is NextRequest for API routes
    const request = args[0] as NextRequest;
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(session, ...args);
  };
}

/**
 * Check if user has required GitHub repository access
 * This can be extended for more specific authorization checks
 */
export async function checkGitHubAccess(session: AuthSession): Promise<boolean> {
  try {
    // Basic check - user has GitHub account connected
    if (!session.user.id) {
      return false;
    }

    // Add more sophisticated checks here:
    // - Verify GitHub token is still valid
    // - Check if user has at least one public repository
    // - Check account creation date to prevent farming

    return true;
  } catch (error) {
    console.error('[Auth] Failed to check GitHub access:', error);
    return false;
  }
}

/**
 * Utility to check if a lesson/step requires authentication
 * Based on lesson configuration
 */
export interface LessonAuthConfig {
  requiresAuth: boolean;
  authMessage?: string;
  minAccountAge?: number; // days
  requiresGitHubRepo?: boolean;
}

export async function validateLessonAccess(
  authConfig: LessonAuthConfig,
  session?: AuthSession | null
): Promise<{
  allowed: boolean;
  error?: string;
  redirectUrl?: string;
}> {
  // If no auth required, allow access
  if (!authConfig.requiresAuth) {
    return { allowed: true };
  }

  // Check if user is authenticated
  if (!session) {
    return {
      allowed: false,
      error: authConfig.authMessage || 'Authentication required to access this lesson',
      redirectUrl: '/auth-test?error=authentication_required',
    };
  }

  // Check GitHub access if required
  if (authConfig.requiresGitHubRepo) {
    const hasGitHubAccess = await checkGitHubAccess(session);
    if (!hasGitHubAccess) {
      return {
        allowed: false,
        error: 'GitHub repository access required for this lesson',
        redirectUrl: '/auth-test?error=github_access_required',
      };
    }
  }

  // Check account age if specified
  if (authConfig.minAccountAge) {
    const accountAge = Date.now() - new Date(session.user.createdAt).getTime();
    const requiredAge = authConfig.minAccountAge * 24 * 60 * 60 * 1000; // Convert days to ms

    if (accountAge < requiredAge) {
      return {
        allowed: false,
        error: `Account must be at least ${authConfig.minAccountAge} days old`,
        redirectUrl: '/auth-test?error=account_too_new',
      };
    }
  }

  return { allowed: true };
}

/**
 * Server Component wrapper that requires authentication
 * Usage: export default requireAuthComponent(MyComponent)
 * Note: Commented out as JSX requires proper file extension (.tsx)
 */
// export function requireAuthComponent<P extends {}>(
//   Component: React.ComponentType<P & { session: AuthSession }>
// ) {
//   return async function AuthenticatedComponent(props: P) {
//     const session = await requireAuth();
//     return <Component {...props} session={session} />;
//   };
// }

/**
 * Utility for logging auth events (for analytics/security)
 */
export async function logAuthEvent(
  event: 'login' | 'logout' | 'access_denied' | 'lesson_access',
  session: AuthSession | null,
  details?: Record<string, any>
) {
  try {
    const logData = {
      event,
      userId: session?.user?.id || null,
      timestamp: new Date().toISOString(),
      userAgent: (await headers()).get('user-agent') || null,
      ip: (await headers()).get('x-forwarded-for') || (await headers()).get('x-real-ip') || null,
      ...details,
    };

    // In a real app, you'd send this to your logging service
    console.log('[Auth Event]', JSON.stringify(logData, null, 2));

    // Could integrate with services like:
    // - PostHog for analytics
    // - Sentry for error tracking
    // - Custom logging database

  } catch (error) {
    console.error('[Auth] Failed to log auth event:', error);
  }
}