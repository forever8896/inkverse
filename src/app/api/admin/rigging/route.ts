/**
 * GET /api/admin/rigging
 *
 * Returns paginated list of generation jobs eligible for rigging.
 * Jobs must have status 'completed' and have a GLB file.
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';

export interface RiggableJob {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  prompt: string;
  style: string;
  stage: string;
  glbS3Key: string;
  glbUrl?: string;
  // Rigging status fields
  tripoImportTaskId?: string;
  tripoImportStatus?: string;
  riggingStatus?: string;
  riggingTaskId?: string;
  rigCheckTaskId?: string;
  rigType?: string;
  riggedGlbS3Key?: string;
  riggedGlbUrl?: string;
  animationTaskId?: string;
  animationPreset?: string;
  animatedGlbS3Key?: string;
  animatedGlbUrl?: string;
  tripoEstimatedCost: number;
  riggingStartedAt?: string;
  riggingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiggingJobsResponse {
  success: boolean;
  jobs?: RiggableJob[];
  total?: number;
  error?: string;
}

// Status badge display mapping
export const RIGGING_STATUS_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  // Not started
  'null': { label: 'Not Imported', emoji: '--', color: 'gray' },
  // Import statuses
  'importing': { label: 'Importing...', emoji: '📤', color: 'yellow' },
  'imported': { label: 'Imported', emoji: '📦', color: 'blue' },
  'import_failed': { label: 'Import Failed', emoji: '❌', color: 'red' },
  // Rig check statuses
  'checking': { label: 'Checking...', emoji: '🔍', color: 'blue' },
  'riggable': { label: 'Riggable', emoji: '✓', color: 'green' },
  'not_riggable': { label: 'Not Riggable', emoji: '✗', color: 'red' },
  // Rigging statuses
  'rigging': { label: 'Rigging...', emoji: '🦴', color: 'purple' },
  'rigged': { label: 'Rigged', emoji: '🦴', color: 'green' },
  'rig_failed': { label: 'Rig Failed', emoji: '❌', color: 'red' },
  // Animation statuses
  'animating': { label: 'Animating...', emoji: '🎬', color: 'cyan' },
  'animated': { label: 'Animated', emoji: '🎬', color: 'emerald' },
  'animation_failed': { label: 'Animation Failed', emoji: '❌', color: 'red' },
};

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const riggingStatus = searchParams.get('riggingStatus'); // Filter by rigging status
    const rigType = searchParams.get('rigType');             // Filter by rig type
    const search = searchParams.get('search');               // Search prompt/ID

    const offset = (page - 1) * limit;

    // Build search conditions
    // Base condition: completed jobs with GLB
    let whereConditions: string[] = [
      "mg.status = 'completed'",
      "mg.glb_s3_key IS NOT NULL",
    ];
    let queryParams: any[] = [];

    // Search filter
    if (search) {
      whereConditions.push(`(
        mg.prompt ILIKE $${queryParams.length + 1} OR
        mg.id::text ILIKE $${queryParams.length + 1} OR
        u.name ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Rigging status filter
    if (riggingStatus) {
      if (riggingStatus === 'null' || riggingStatus === 'not_imported') {
        whereConditions.push('mg.rigging_status IS NULL AND mg.tripo_import_status IS NULL');
      } else if (riggingStatus === 'importing' || riggingStatus === 'imported' || riggingStatus === 'import_failed') {
        whereConditions.push(`mg.tripo_import_status = $${queryParams.length + 1}`);
        queryParams.push(riggingStatus);
      } else {
        whereConditions.push(`mg.rigging_status = $${queryParams.length + 1}`);
        queryParams.push(riggingStatus);
      }
    }

    // Rig type filter
    if (rigType) {
      whereConditions.push(`mg.rig_type = $${queryParams.length + 1}`);
      queryParams.push(rigType);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM monster_generations mg
      LEFT JOIN "user" u ON mg.user_id = u.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get jobs with rigging info
    const jobsQuery = `
      SELECT
        mg.id,
        mg.user_id,
        u.name as user_name,
        u.email as user_email,
        mg.prompt,
        mg.style,
        mg.stage,
        mg.glb_s3_key,
        mg.glb_url,
        mg.tripo_import_task_id,
        mg.tripo_import_status,
        mg.rigging_status,
        mg.rigging_task_id,
        mg.rig_check_task_id,
        mg.rig_type,
        mg.rigged_glb_s3_key,
        mg.rigged_glb_url,
        mg.animation_task_id,
        mg.animation_preset,
        mg.animated_glb_s3_key,
        mg.animated_glb_url,
        mg.tripo_estimated_cost,
        mg.rigging_started_at,
        mg.rigging_completed_at,
        mg.created_at,
        mg.updated_at
      FROM monster_generations mg
      LEFT JOIN "user" u ON mg.user_id = u.id
      ${whereClause}
      ORDER BY
        CASE
          WHEN mg.rigging_status IS NOT NULL THEN 0
          WHEN mg.tripo_import_status IS NOT NULL THEN 1
          ELSE 2
        END,
        mg.updated_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const finalParams = [...queryParams, limit, offset];
    const jobsResult = await pool.query(jobsQuery, finalParams);

    // Map database rows to job objects
    const jobs: RiggableJob[] = jobsResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      prompt: row.prompt,
      style: row.style,
      stage: row.stage,
      glbS3Key: row.glb_s3_key,
      glbUrl: row.glb_url,
      tripoImportTaskId: row.tripo_import_task_id,
      tripoImportStatus: row.tripo_import_status,
      riggingStatus: row.rigging_status,
      riggingTaskId: row.rigging_task_id,
      rigCheckTaskId: row.rig_check_task_id,
      rigType: row.rig_type,
      riggedGlbS3Key: row.rigged_glb_s3_key,
      riggedGlbUrl: row.rigged_glb_url,
      animationTaskId: row.animation_task_id,
      animationPreset: row.animation_preset,
      animatedGlbS3Key: row.animated_glb_s3_key,
      animatedGlbUrl: row.animated_glb_url,
      tripoEstimatedCost: parseFloat(row.tripo_estimated_cost || 0),
      riggingStartedAt: row.rigging_started_at?.toISOString(),
      riggingCompletedAt: row.rigging_completed_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    return successResponse({ jobs, total });

  } catch (error) {
    logError('Admin Rigging API', error);
    return internalErrorResponse(error, 'Failed to fetch riggable jobs');
  }
}
