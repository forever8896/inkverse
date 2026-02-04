/**
 * POST /api/admin/rigging/[jobId]/check
 *
 * Run PreRigCheck on an imported model to determine riggability and rig type.
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
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
      `SELECT id, tripo_import_task_id, tripo_import_status, rigging_status
       FROM monster_generations
       WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return notFoundResponse('Job');
    }

    const job = jobResult.rows[0];

    // Check prerequisites
    if (job.tripo_import_status !== 'imported') {
      return badRequestResponse('Model must be imported to Tripo first');
    }

    if (!job.tripo_import_task_id) {
      return badRequestResponse('Missing Tripo import task ID');
    }

    if (job.rigging_status === 'checking') {
      return badRequestResponse('PreRigCheck already in progress');
    }

    if (job.rigging_status === 'riggable' || job.rigging_status === 'not_riggable') {
      return badRequestResponse('PreRigCheck already completed');
    }

    // Update status to checking
    await pool.query(
      `UPDATE monster_generations
       SET rigging_status = 'checking'
       WHERE id = $1`,
      [jobId]
    );

    try {
      const tripoService = getTripoRiggingService();

      // Start PreRigCheck
      const { taskId } = await tripoService.preRigCheck(job.tripo_import_task_id);

      // Update with task ID
      await pool.query(
        `UPDATE monster_generations
         SET rig_check_task_id = $1
         WHERE id = $2`,
        [taskId, jobId]
      );

      // Wait for check to complete
      const checkResult = await tripoService.waitForPreRigCheck(taskId, 60000);

      // Update with results
      if (checkResult.riggable) {
        await pool.query(
          `UPDATE monster_generations
           SET rigging_status = 'riggable',
               rig_type = $1
           WHERE id = $2`,
          [checkResult.rigType, jobId]
        );

        return successResponse({
          taskId,
          riggable: true,
          rigType: checkResult.rigType,
          message: `Model is riggable as ${checkResult.rigType}`,
        });
      } else {
        await pool.query(
          `UPDATE monster_generations
           SET rigging_status = 'not_riggable'
           WHERE id = $1`,
          [jobId]
        );

        return successResponse({
          taskId,
          riggable: false,
          message: 'Model cannot be rigged',
        });
      }

    } catch (checkError) {
      // Reset status on failure
      await pool.query(
        `UPDATE monster_generations
         SET rigging_status = NULL
         WHERE id = $1`,
        [jobId]
      );

      throw checkError;
    }

  } catch (error) {
    logError('Admin Rigging Check API', error);
    return internalErrorResponse(error, 'Failed to run PreRigCheck');
  }
}
