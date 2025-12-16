/**
 * GET /api/admin/users/[userId]
 * Returns detailed information about a specific user including recent jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';

export interface AdminUserDetail {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: string;
  jobCount: number;
  totalSpent: number;
  lastActive?: string;
  recentJobs: Array<{
    id: string;
    prompt: string;
    status: string;
    totalCost: number;
    createdAt: string;
    completedAt?: string;
  }>;
}

export interface AdminUserDetailResponse {
  success: boolean;
  user?: AdminUserDetail;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { userId } = await params;
    const pool = getPool();

    // Validate user ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get user details with job statistics
    // Note: We only store GitHub ID - name/email are synthetic
    const userQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.image,
        u."createdAt",
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
      WHERE u.id = $1
    `;

    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userRow = userResult.rows[0];

    // Get recent jobs for this user
    const jobsQuery = `
      SELECT 
        id,
        prompt,
        status,
        total_cost,
        created_at,
        completed_at
      FROM monster_generations
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const jobsResult = await pool.query(jobsQuery, [userId]);

    const recentJobs = jobsResult.rows.map((row: any) => ({
      id: row.id,
      prompt: row.prompt,
      status: row.status,
      totalCost: parseFloat(row.total_cost || 0),
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at?.toISOString()
    }));

    const user: AdminUserDetail = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      image: userRow.image,
      createdAt: userRow.createdAt.toISOString(),
      jobCount: parseInt(userRow.job_count),
      totalSpent: parseFloat(userRow.total_spent || 0),
      lastActive: userRow.last_active?.toISOString(),
      recentJobs
    };

    const response: AdminUserDetailResponse = {
      success: true,
      user
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Admin user detail error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}