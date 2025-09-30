/**
 * GET /api/admin/users
 * Returns paginated list of users with job statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';

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

export interface AdminUsersResponse {
  success: boolean;
  users?: AdminUser[];
  total?: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition = '';
    let searchParams_values: any[] = [];
    
    if (search) {
      searchCondition = `WHERE (
        u.name ILIKE $${searchParams_values.length + 1} OR 
        u.email ILIKE $${searchParams_values.length + 1} OR 
        u.id::text ILIKE $${searchParams_values.length + 1}
      )`;
      searchParams_values.push(`%${search}%`);
    }

    // Build sort condition
    let sortCondition = '';
    switch (sortBy) {
      case 'createdAt':
        sortCondition = `ORDER BY u."createdAt" ${sortOrder.toUpperCase()}`;
        break;
      case 'jobCount':
        sortCondition = `ORDER BY job_count ${sortOrder.toUpperCase()}, u."createdAt" DESC`;
        break;
      case 'totalSpent':
        sortCondition = `ORDER BY total_spent ${sortOrder.toUpperCase()}, u."createdAt" DESC`;
        break;
      case 'lastActive':
        sortCondition = `ORDER BY last_active ${sortOrder.toUpperCase()} NULLS LAST, u."createdAt" DESC`;
        break;
      default:
        sortCondition = `ORDER BY u."createdAt" ${sortOrder.toUpperCase()}`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "user" u
      ${searchCondition}
    `;
    
    const countResult = await pool.query(countQuery, searchParams_values);
    const total = parseInt(countResult.rows[0].total);

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
      ${searchCondition}
      ${sortCondition}
      LIMIT $${searchParams_values.length + 1} OFFSET $${searchParams_values.length + 2}
    `;

    const queryParams = [...searchParams_values, limit, offset];
    const usersResult = await pool.query(usersQuery, queryParams);

    const users: AdminUser[] = usersResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      createdAt: row.createdAt.toISOString(),
      emailVerified: row.emailVerified?.toISOString(),
      jobCount: parseInt(row.job_count),
      totalSpent: parseFloat(row.total_spent || 0),
      lastActive: row.last_active?.toISOString()
    }));

    const response: AdminUsersResponse = {
      success: true,
      users,
      total
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Admin users error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}