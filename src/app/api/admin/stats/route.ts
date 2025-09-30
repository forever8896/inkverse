/**
 * GET /api/admin/stats
 * Returns admin dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';

export interface AdminStatsResponse {
  success: boolean;
  stats?: {
    totalUsers: number;
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalCost: number;
    totalOpenAICost: number;
    totalFalCost: number;
    totalTokensUsed: number;
    avgJobTime: number;
    recentActivity: Array<{
      type: 'user_registered' | 'job_created' | 'job_completed' | 'job_failed';
      timestamp: string;
      details: string;
    }>;
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const pool = getPool();

    // Get user count
    const userCountResult = await pool.query(`
      SELECT COUNT(*) as count FROM "user"
    `);
    const totalUsers = parseInt(userCountResult.rows[0].count);

    // Get job statistics including token tracking
    const jobStatsResult = await pool.query(`
      SELECT
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status IN ('pending', 'generating_image', 'converting_3d', 'image_generation_retrying', 'conversion_retrying') THEN 1 END) as active_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status IN ('failed_permanent', 'image_generation_failed', 'conversion_failed') THEN 1 END) as failed_jobs,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(openai_estimated_cost), 0) as total_openai_cost,
        COALESCE(SUM(fal_estimated_cost), 0) as total_fal_cost,
        COALESCE(SUM(openai_total_tokens), 0) as total_tokens_used,
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60), 0) as avg_job_time_minutes
      FROM monster_generations
    `);

    const jobStats = jobStatsResult.rows[0];

    // Get recent activity (last 50 activities)
    const recentActivityResult = await pool.query(`
      SELECT 
        'job_created' as type,
        created_at as timestamp,
        'Job created: ' || LEFT(prompt, 50) || '...' as details
      FROM monster_generations 
      WHERE created_at > NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'job_completed' as type,
        completed_at as timestamp,
        'Job completed: ' || LEFT(prompt, 50) || '...' as details
      FROM monster_generations 
      WHERE completed_at IS NOT NULL AND completed_at > NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'job_failed' as type,
        updated_at as timestamp,
        'Job failed: ' || LEFT(prompt, 50) || '...' as details
      FROM monster_generations 
      WHERE status IN ('failed_permanent', 'image_generation_failed', 'conversion_failed') 
        AND updated_at > NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'user_registered' as type,
        "createdAt" as timestamp,
        'User registered: ' || COALESCE(name, email, id) as details
      FROM "user"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
      
      ORDER BY timestamp DESC 
      LIMIT 20
    `);

    const recentActivity = recentActivityResult.rows.map((row: any) => ({
      type: row.type,
      timestamp: row.timestamp.toISOString(),
      details: row.details
    }));

    const stats = {
      totalUsers,
      totalJobs: parseInt(jobStats.total_jobs),
      activeJobs: parseInt(jobStats.active_jobs),
      completedJobs: parseInt(jobStats.completed_jobs),
      failedJobs: parseInt(jobStats.failed_jobs),
      totalCost: parseFloat(jobStats.total_cost),
      totalOpenAICost: parseFloat(jobStats.total_openai_cost),
      totalFalCost: parseFloat(jobStats.total_fal_cost),
      totalTokensUsed: parseInt(jobStats.total_tokens_used),
      avgJobTime: Math.round(parseFloat(jobStats.avg_job_time_minutes)),
      recentActivity
    };

    const response: AdminStatsResponse = {
      success: true,
      stats
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Admin stats error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}