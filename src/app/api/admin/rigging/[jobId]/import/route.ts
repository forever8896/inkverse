/**
 * POST /api/admin/rigging/[jobId]/import
 *
 * Import a model to Tripo's system (required before rigging).
 * Downloads GLB from our S3, uploads to Tripo's storage, and imports it.
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { S3Service } from '@/services/s3-service';
import { getTripoRiggingService } from '@/services/tripo-rigging-service';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { jobId } = await context.params;
    const pool = getPool();

    // Get job details
    const jobResult = await pool.query(
      `SELECT id, glb_s3_key, tripo_import_status, rigging_status
       FROM monster_generations
       WHERE id = $1 AND status = 'completed' AND glb_s3_key IS NOT NULL`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return notFoundResponse('Job');
    }

    const job = jobResult.rows[0];

    // Check if already importing or imported
    if (job.tripo_import_status === 'importing') {
      return badRequestResponse('Import already in progress');
    }

    if (job.tripo_import_status === 'imported') {
      return badRequestResponse('Model already imported to Tripo');
    }

    // Update status to importing
    await pool.query(
      `UPDATE monster_generations
       SET tripo_import_status = 'importing',
           rigging_started_at = NOW()
       WHERE id = $1`,
      [jobId]
    );

    try {
      // Download GLB from our S3
      const s3Service = S3Service.getInstance();
      const glbBuffer = await s3Service.downloadFile(job.glb_s3_key);

      // Import to Tripo
      const tripoService = getTripoRiggingService();
      const { taskId, credentials } = await tripoService.importGLBFromBuffer(glbBuffer);

      // Update with task ID
      await pool.query(
        `UPDATE monster_generations
         SET tripo_import_task_id = $1
         WHERE id = $2`,
        [taskId, jobId]
      );

      // Wait for import to complete (with timeout)
      const importResult = await tripoService.waitForImport(taskId, 120000);

      // Update status to imported
      await pool.query(
        `UPDATE monster_generations
         SET tripo_import_status = 'imported'
         WHERE id = $1`,
        [jobId]
      );

      return successResponse({
        taskId,
        status: 'imported',
        message: 'Model successfully imported to Tripo',
      });

    } catch (importError) {
      // Update status to failed
      await pool.query(
        `UPDATE monster_generations
         SET tripo_import_status = 'import_failed'
         WHERE id = $1`,
        [jobId]
      );

      throw importError;
    }

  } catch (error) {
    logError('Admin Rigging Import API', error);
    return internalErrorResponse(error, 'Failed to import model to Tripo');
  }
}
