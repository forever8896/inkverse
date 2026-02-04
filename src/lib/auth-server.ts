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
import { query } from '@/lib/postgres';

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

// In-memory cache for GitHub access checks (keyed by userId, short-lived per serverless invocation)
const gitHubAccessCache = new Map<string, { result: boolean; timestamp: number }>();
const GITHUB_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const MINIMUM_ACCOUNT_AGE_DAYS = 30;
const MINIMUM_PUBLIC_REPOS = 1;

/**
 * Check if user has required GitHub repository access
 * Queries the account table for GitHub token, then verifies:
 * - At least one public repository
 * - Account age >= 30 days
 * Caches results to avoid repeated GitHub API calls within same invocation
 */
export async function checkGitHubAccess(session: AuthSession): Promise<boolean> {
  try {
    if (!session.user.id) {
      return false;
    }

    // Check cache first
    const cached = gitHubAccessCache.get(session.user.id);
    if (cached && Date.now() - cached.timestamp < GITHUB_CACHE_TTL_MS) {
      return cached.result;
    }

    // Query the account table for the user's GitHub access token
    const { rows } = await query<{ accessToken: string }>(
      'SELECT "accessToken" FROM account WHERE "userId" = $1 AND "providerId" = $2',
      [session.user.id, 'github']
    );

    if (rows.length === 0 || !rows[0].accessToken) {
      gitHubAccessCache.set(session.user.id, { result: false, timestamp: Date.now() });
      return false;
    }

    const accessToken = rows[0].accessToken;

    // Call GitHub REST API to get user profile (works with zero scopes for public profile)
    let githubUser: { public_repos: number; created_at: string };
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'MonstersInk-App',
        },
      });

      if (!response.ok) {
        // If GitHub API is unreachable or token invalid, fail gracefully
        console.warn(`[Auth] GitHub API returned ${response.status} for user ${session.user.id}`);
        gitHubAccessCache.set(session.user.id, { result: true, timestamp: Date.now() });
        return true;
      }

      githubUser = await response.json();
    } catch (fetchError) {
      // Network error - fail gracefully, don't block users due to GitHub downtime
      console.warn('[Auth] GitHub API unreachable, allowing access:', fetchError);
      gitHubAccessCache.set(session.user.id, { result: true, timestamp: Date.now() });
      return true;
    }

    // Check minimum public repos
    if (githubUser.public_repos < MINIMUM_PUBLIC_REPOS) {
      console.warn(`[Auth] User ${session.user.id} has ${githubUser.public_repos} public repos (minimum: ${MINIMUM_PUBLIC_REPOS})`);
      gitHubAccessCache.set(session.user.id, { result: false, timestamp: Date.now() });
      return false;
    }

    // Check account age (>= 30 days)
    const accountAgeMs = Date.now() - new Date(githubUser.created_at).getTime();
    const minimumAgeMs = MINIMUM_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (accountAgeMs < minimumAgeMs) {
      console.warn(`[Auth] User ${session.user.id} GitHub account too new (${Math.floor(accountAgeMs / 86400000)} days)`);
      gitHubAccessCache.set(session.user.id, { result: false, timestamp: Date.now() });
      return false;
    }

    gitHubAccessCache.set(session.user.id, { result: true, timestamp: Date.now() });
    return true;
  } catch (error) {
    // Unexpected error - fail gracefully
    console.error('[Auth] Failed to check GitHub access:', error);
    return true;
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
