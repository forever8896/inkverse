/**
 * GET /api/admin/jobs
 * Returns paginated list of generation jobs with user info
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';

export interface AdminGenerationJob {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  workflowRunId?: string;
  prompt: string;
  style: string;
  stage: string;
  status: string;
  progress: number;
  errorMessage?: string;
  userMessage?: string;
  totalCost: number;
  openaiTextTokens: number;
  openaiImageTokens: number;
  openaiTotalTokens: number;
  openaiEstimatedCost: number;
  falEstimatedCost: number;
  costCalculationMethod: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  lastError?: {
    type: string;
    userMessage: string;
    retryable: boolean;
    maxRetries: number;
    currentRetries: number;
  };
  // Workflow observability fields
  workflowStatus?: string | null;
  currentStepName?: string | null;
}

export interface AdminJobsResponse {
  success: boolean;
  jobs?: AdminGenerationJob[];
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
    const limit = parseInt(searchParams.get('limit') || '25');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const offset = (page - 1) * limit;

    // Build search conditions
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    if (search) {
      whereConditions.push(`(
        mg.prompt ILIKE $${queryParams.length + 1} OR 
        mg.id::text ILIKE $${queryParams.length + 1} OR 
        u.name ILIKE $${queryParams.length + 1} OR 
        u.email ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push(`mg.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (userId) {
      whereConditions.push(`mg.user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build sort condition
    let sortCondition = '';
    switch (sortBy) {
      case 'createdAt':
        sortCondition = `ORDER BY mg.created_at ${sortOrder.toUpperCase()}`;
        break;
      case 'updatedAt':
        sortCondition = `ORDER BY mg.updated_at ${sortOrder.toUpperCase()}`;
        break;
      case 'status':
        sortCondition = `ORDER BY mg.status ${sortOrder.toUpperCase()}, mg.updated_at DESC`;
        break;
      case 'progress':
        sortCondition = `ORDER BY mg.progress ${sortOrder.toUpperCase()}, mg.updated_at DESC`;
        break;
      case 'totalCost':
        sortCondition = `ORDER BY mg.total_cost ${sortOrder.toUpperCase()}, mg.updated_at DESC`;
        break;
      default:
        sortCondition = `ORDER BY mg.updated_at ${sortOrder.toUpperCase()}`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM monster_generations mg
      LEFT JOIN "user" u ON mg.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get jobs with user info
    const jobsQuery = `
      SELECT
        mg.id,
        mg.user_id,
        u.name as user_name,
        u.email as user_email,
        mg.workflow_run_id,
        mg.prompt,
        mg.style,
        mg.stage,
        mg.status,
        mg.progress,
        mg.error_message,
        mg.user_message,
        mg.total_cost,
        mg.openai_text_tokens,
        mg.openai_image_tokens,
        mg.openai_total_tokens,
        mg.openai_estimated_cost,
        mg.fal_estimated_cost,
        mg.cost_calculation_method,
        mg.retry_count,
        mg.last_error,
        mg.created_at,
        mg.updated_at,
        mg.completed_at
      FROM monster_generations mg
      LEFT JOIN "user" u ON mg.user_id = u.id
      ${whereClause}
      ${sortCondition}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const finalParams = [...queryParams, limit, offset];
    const jobsResult = await pool.query(jobsQuery, finalParams);

    // Map database rows to job objects
    const jobs: AdminGenerationJob[] = jobsResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      workflowRunId: row.workflow_run_id,
      prompt: row.prompt,
      style: row.style,
      stage: row.stage,
      status: row.status,
      progress: row.progress,
      errorMessage: row.error_message,
      userMessage: row.user_message,
      totalCost: parseFloat(row.total_cost || 0),
      openaiTextTokens: parseInt(row.openai_text_tokens || 0),
      openaiImageTokens: parseInt(row.openai_image_tokens || 0),
      openaiTotalTokens: parseInt(row.openai_total_tokens || 0),
      openaiEstimatedCost: parseFloat(row.openai_estimated_cost || 0),
      falEstimatedCost: parseFloat(row.fal_estimated_cost || 0),
      costCalculationMethod: row.cost_calculation_method || 'legacy',
      retryCount: row.retry_count || 0,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      completedAt: row.completed_at?.toISOString(),
      lastError: row.last_error ? (() => {
        try {
          return JSON.parse(row.last_error);
        } catch {
          return undefined;
        }
      })() : undefined,
      // Workflow fields will be enriched below
      workflowStatus: null,
      currentStepName: null,
    }));

    // Enrich jobs with workflow status (only for jobs with workflow run IDs)
    const { getWorkflowStatus } = await import('@/lib/workflow-data');

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        if (!job.workflowRunId) {
          return job; // Legacy job without workflow
        }

        const workflowStatus = await getWorkflowStatus(job.workflowRunId);

        return {
          ...job,
          workflowStatus: workflowStatus?.status || null,
          currentStepName: workflowStatus?.currentStepName || null,
        };
      })
    );

    return successResponse({ jobs: enrichedJobs, total });

  } catch (error) {
    logError('Admin Jobs API', error);
    return internalErrorResponse(error, 'Failed to fetch jobs');
  }
}