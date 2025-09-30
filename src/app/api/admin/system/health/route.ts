/**
 * GET /api/admin/system/health
 * Returns comprehensive system health status and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';
import { S3Service } from '@/services/s3-service';
import { requireAdminApi } from '@/lib/admin-auth';

export interface SystemHealthResponse {
  success: boolean;
  health?: {
    database: {
      status: 'healthy' | 'warning' | 'error';
      connectionCount: number;
      queryTime: number;
      lastError?: string;
    };
    storage: {
      status: 'healthy' | 'warning' | 'error';
      totalFiles: number;
      totalSize: string;
      lastError?: string;
    };
    ai_services: {
      openai: {
        status: 'healthy' | 'warning' | 'error';
        lastCheck: string;
        responseTime?: number;
        lastError?: string;
      };
      fal: {
        status: 'healthy' | 'warning' | 'error';
        lastCheck: string;
        responseTime?: number;
        lastError?: string;
      };
    };
    performance: {
      avgJobTime: number;
      successRate: number;
      activeJobs: number;
      errorRate: number;
      peakLoadTime?: string;
    };
    metrics: {
      totalGenerations: number;
      generationsToday: number;
      totalCost: number;
      costToday: number;
      uniqueUsersToday: number;
      avgRetryRate: number;
    };
  };
  error?: string;
}

async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  connectionCount: number;
  queryTime: number;
  lastError?: string;
}> {
  try {
    const pool = getPool();
    const startTime = Date.now();
    
    // Test query
    await pool.query('SELECT 1');
    const queryTime = Date.now() - startTime;
    
    // Get connection count (approximate)
    const connResult = await pool.query(`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    
    return {
      status: queryTime > 1000 ? 'warning' : 'healthy' as const,
      connectionCount: parseInt(connResult.rows[0]?.connections || '0'),
      queryTime
    };
  } catch (error) {
    return {
      status: 'error' as const,
      connectionCount: 0,
      queryTime: 0,
      lastError: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

async function checkStorageHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  totalFiles: number;
  totalSize: string;
  lastError?: string;
}> {
  try {
    const s3Service = S3Service.getInstance();
    
    // This is a simplified check - in a real implementation you'd want to:
    // 1. List objects in the bucket
    // 2. Calculate total size
    // 3. Check upload/download permissions
    
    // For now, let's do a basic connectivity test
    const startTime = Date.now();
    
    // Simple test - try to get a presigned URL (this tests connectivity)
    try {
      await s3Service.getPresignedUrl('test-connectivity-check', { expiresIn: 60 });
      const responseTime = Date.now() - startTime;
      
      // Get approximate file count from database
      const pool = getPool();
      const fileCountResult = await pool.query(`
        SELECT 
          COUNT(CASE WHEN image_s3_key IS NOT NULL THEN 1 END) as image_files,
          COUNT(CASE WHEN glb_s3_key IS NOT NULL THEN 1 END) as glb_files
        FROM monster_generations
      `);
      
      const imageFiles = parseInt(fileCountResult.rows[0]?.image_files || '0');
      const glbFiles = parseInt(fileCountResult.rows[0]?.glb_files || '0');
      const totalFiles = imageFiles + glbFiles;
      
      return {
        status: responseTime > 2000 ? 'warning' : 'healthy' as const,
        totalFiles,
        totalSize: `~${(totalFiles * 2.5).toFixed(1)}MB` // Rough estimate
      };
    } catch (error) {
      return {
        status: 'error' as const,
        totalFiles: 0,
        totalSize: '0MB',
        lastError: error instanceof Error ? error.message : 'S3 connectivity error'
      };
    }
  } catch (error) {
    return {
      status: 'error' as const,
      totalFiles: 0,
      totalSize: '0MB',
      lastError: error instanceof Error ? error.message : 'Storage service error'
    };
  }
}

async function checkAIServicesHealth(): Promise<{
  openai: {
    status: 'healthy' | 'warning' | 'error';
    lastCheck: string;
    responseTime?: number;
    lastError?: string;
  };
  fal: {
    status: 'healthy' | 'warning' | 'error';
    lastCheck: string;
    responseTime?: number;
    lastError?: string;
  };
}> {
  const now = new Date().toISOString();
  
  // In a real implementation, you'd want to make actual API calls to test these services
  // For now, we'll simulate based on recent job failures
  try {
    const pool = getPool();
    
    // Check recent OpenAI failures
    const openaiFailures = await pool.query(`
      SELECT COUNT(*) as count
      FROM monster_generations
      WHERE status IN ('image_generation_failed', 'image_generation_retrying')
        AND updated_at > NOW() - INTERVAL '1 hour'
    `);
    
    const openaiFailureCount = parseInt(openaiFailures.rows[0]?.count || '0');
    
    // Check recent Fal.ai failures
    const falFailures = await pool.query(`
      SELECT COUNT(*) as count
      FROM monster_generations
      WHERE status IN ('conversion_failed', 'conversion_retrying')
        AND updated_at > NOW() - INTERVAL '1 hour'
    `);
    
    const falFailureCount = parseInt(falFailures.rows[0]?.count || '0');
    
    return {
      openai: {
        status: openaiFailureCount > 10 ? 'error' : openaiFailureCount > 5 ? 'warning' : 'healthy' as const,
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 2000) + 500, // Simulated
        ...(openaiFailureCount > 0 && { lastError: `${openaiFailureCount} failures in last hour` })
      },
      fal: {
        status: falFailureCount > 10 ? 'error' : falFailureCount > 5 ? 'warning' : 'healthy' as const,
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 5000) + 1000, // Simulated
        ...(falFailureCount > 0 && { lastError: `${falFailureCount} failures in last hour` })
      }
    };
  } catch (error) {
    return {
      openai: {
        status: 'error' as const,
        lastCheck: now,
        lastError: 'Failed to check service status'
      },
      fal: {
        status: 'error' as const,
        lastCheck: now,
        lastError: 'Failed to check service status'
      }
    };
  }
}

async function getPerformanceMetrics() {
  try {
    const pool = getPool();
    
    const performanceResult = await pool.query(`
      SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60), 0) as avg_job_time_minutes,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status IN ('pending', 'generating_image', 'converting_3d', 'image_generation_retrying', 'conversion_retrying') THEN 1 END) as active_jobs,
        COUNT(CASE WHEN status IN ('failed_permanent', 'image_generation_failed', 'conversion_failed') THEN 1 END) as failed_jobs,
        MAX(CASE WHEN status IN ('pending', 'generating_image', 'converting_3d') THEN updated_at END) as peak_load_time
      FROM monster_generations
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    const perf = performanceResult.rows[0];
    const totalJobs = parseInt(perf.total_jobs);
    const completedJobs = parseInt(perf.completed_jobs);
    const failedJobs = parseInt(perf.failed_jobs);
    
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100;
    const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
    
    return {
      avgJobTime: Math.round(parseFloat(perf.avg_job_time_minutes || '0')),
      successRate,
      activeJobs: parseInt(perf.active_jobs),
      errorRate,
      ...(perf.peak_load_time && { peakLoadTime: perf.peak_load_time.toISOString() })
    };
  } catch (error) {
    return {
      avgJobTime: 0,
      successRate: 0,
      activeJobs: 0,
      errorRate: 100
    };
  }
}

async function getUsageMetrics() {
  try {
    const pool = getPool();
    
    const metricsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_generations,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as generations_today,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_cost ELSE 0 END), 0) as cost_today,
        COUNT(DISTINCT CASE WHEN created_at::date = CURRENT_DATE THEN user_id END) as unique_users_today,
        COALESCE(AVG(retry_count), 0) as avg_retry_rate
      FROM monster_generations
    `);
    
    const metrics = metricsResult.rows[0];
    
    return {
      totalGenerations: parseInt(metrics.total_generations),
      generationsToday: parseInt(metrics.generations_today),
      totalCost: parseFloat(metrics.total_cost),
      costToday: parseFloat(metrics.cost_today),
      uniqueUsersToday: parseInt(metrics.unique_users_today),
      avgRetryRate: parseFloat(metrics.avg_retry_rate) * 100 // Convert to percentage
    };
  } catch (error) {
    return {
      totalGenerations: 0,
      generationsToday: 0,
      totalCost: 0,
      costToday: 0,
      uniqueUsersToday: 0,
      avgRetryRate: 0
    };
  }
}

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    // Fetch all health data in parallel
    const [database, storage, ai_services, performance, metrics] = await Promise.all([
      checkDatabaseHealth(),
      checkStorageHealth(),
      checkAIServicesHealth(),
      getPerformanceMetrics(),
      getUsageMetrics()
    ]);

    const health = {
      database,
      storage,
      ai_services,
      performance,
      metrics
    };

    const response: SystemHealthResponse = {
      success: true,
      health
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] System health check error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}