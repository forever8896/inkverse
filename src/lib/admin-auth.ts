/**
 * Admin Authorization Utilities
 *
 * Provides role-based access control for admin functionality.
 * Uses Better Auth admin plugin for role management.
 */

import { auth } from './auth';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if a user is an admin using Better Auth session
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Query user directly from database to get role
    // We can't use auth.api.listUsers() as it requires admin permissions
    // The session object should include role, but for checking other users we need DB
    const { getPool } = await import('./postgres');
    const pool = getPool();

    const result = await pool.query(
      'SELECT role FROM "user" WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].role === 'admin';
  } catch (error) {
    console.error('[AdminAuth] Error checking admin status:', error);
    return false;
  }
}

/**
 * Require admin access in a server component or page
 * Redirects unauthenticated users to the login page and non-admins to home
 *
 * @example
 * ```typescript
 * export default async function AdminPage() {
 *   await requireAdmin();
 *   // ... rest of component
 * }
 * ```
 */
export async function requireAdmin(redirectPath: string = '/admin'): Promise<void> {
  const { getServerSession } = await import('./auth-server');
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const isAdmin = await isUserAdmin(session.user.id);

  if (!isAdmin) {
    console.warn(`[AdminAuth] Unauthorized admin access attempt by user ${session.user.id}`);
    redirect('/');
  }
}

/**
 * Middleware to protect admin API routes
 * Returns 401 if not authenticated, 403 if not admin
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdminApi(request);
 *   if (authResult.error) return authResult.response;
 *
 *   const { session, user } = authResult;
 *   // ... rest of API handler
 * }
 * ```
 */
export async function requireAdminApi(request: NextRequest): Promise<{
  session: any;
  user: any;
  error?: boolean;
  response?: NextResponse;
}> {
  try {
    const { getSessionFromRequest } = await import('./auth-server');
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return {
        session: null,
        user: null,
        error: true,
        response: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    const isAdmin = await isUserAdmin(session.user.id);

    if (!isAdmin) {
      console.warn(`[AdminAuth] Unauthorized API access attempt by user ${session.user.id}`);
      return {
        session,
        user: session.user,
        error: true,
        response: NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    return {
      session,
      user: session.user,
    };
  } catch (error) {
    console.error('[AdminAuth] Error in requireAdminApi:', error);
    return {
      session: null,
      user: null,
      error: true,
      response: NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if current session user is admin (for use in auth-server contexts)
 * @param session - Better Auth session object
 * @returns Promise<boolean> - True if user is admin
 */
export async function isSessionAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false;
  return isUserAdmin(session.user.id);
}
