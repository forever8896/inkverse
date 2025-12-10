/**
 * GET /api/admin/users
 * Returns paginated list of users with job statistics
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import {
  extractPaginationParams,
  buildSearchCondition,
  buildSortClause,
  buildLimitOffsetClause,
  type SortFieldMapping,
} from '@/lib/admin-query-builder';

export interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: string;
  emailVerified?: string;
  jobCount: number;
  totalSpent: number;
  lastActive?: string;
}

// Define allowed sort fields with their SQL mappings
const USER_SORT_FIELDS: Record<string, SortFieldMapping> = {
  createdAt: { column: 'u."createdAt"' },
  jobCount: { column: 'job_count', secondary: 'u."createdAt" DESC' },
  totalSpent: { column: 'total_spent', secondary: 'u."createdAt" DESC' },
  lastActive: { column: 'last_active', secondary: 'u."createdAt" DESC', nullsLast: true },
};

// Define searchable fields
const USER_SEARCH_FIELDS = ['u.name', 'u.email', 'u.id::text'];

// Row type from database query
interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  emailVerified: Date | null;
  job_count: string;
  total_spent: string | null;
  last_active: Date | null;
}

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);

    // Extract pagination params using shared utility
    const params = extractPaginationParams(searchParams, {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
    });

    // Build search condition using shared utility
    const searchResult = buildSearchCondition(
      USER_SEARCH_FIELDS,
      params.search,
      params.queryParams
    );

    // Build sort clause using shared utility
    const sortClause = buildSortClause(
      params.sortBy,
      params.sortOrder,
      USER_SORT_FIELDS,
      'createdAt'
    );

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "user" u
      ${searchResult.clause}
    `;

    const countResult = await pool.query(countQuery, params.queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Build LIMIT/OFFSET clause
    const limitOffsetClause = buildLimitOffsetClause(params, params.queryParams);

    // Get users with job statistics
    const usersQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.image,
        u."createdAt",
        u."emailVerified",
        COALESCE(mg.job_count, 0) as job_count,
        COALESCE(mg.total_spent, 0) as total_spent,
        mg.last_active
      FROM "user" u
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) as job_count,
          SUM(total_cost) as total_spent,
          MAX(updated_at) as last_active
        FROM monster_generations
        GROUP BY user_id
      ) mg ON u.id = mg.user_id
      ${searchResult.clause}
      ${sortClause}
      ${limitOffsetClause}
    `;

    const usersResult = await pool.query(usersQuery, params.queryParams);

    const users: AdminUser[] = usersResult.rows.map((row: UserRow) => ({
      id: row.id,
      name: row.name ?? undefined,
      email: row.email ?? undefined,
      image: row.image ?? undefined,
      createdAt: row.createdAt.toISOString(),
      emailVerified: row.emailVerified?.toISOString(),
      jobCount: parseInt(row.job_count),
      totalSpent: parseFloat(row.total_spent || '0'),
      lastActive: row.last_active?.toISOString(),
    }));

    return successResponse({ users, total });

  } catch (error) {
    logError('Admin Users API', error);
    return internalErrorResponse(error, 'Failed to fetch users');
  }
}