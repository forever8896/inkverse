/**
 * POST /api/admin/rigging/[jobId]/rig
 *
 * Apply rigging to a model that has passed PreRigCheck.
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { S3Service } from '@/services/s3-service';
import { getTripoRiggingService, RigType, RiggingSpec, OutputFormat, ModelVersion } from '@/services/tripo-rigging-service';
import { calculateRiggingCost, RigType as PricingRigType } from '@/config/pricing';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

interface RigRequestBody {
  outFormat?: OutputFormat;
  modelVersion?: ModelVersion;
  spec?: RiggingSpec;
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { jobId } = await context.params;
    const pool = getPool();

    // Parse request body
    let body: RigRequestBody = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, use defaults
    }

    const {
      outFormat = 'glb',
      modelVersion = 'v2.0-20250506',
      spec = 'tripo',
    } = body;

    // Get job details
    const jobResult = await pool.query(
      `SELECT id, user_id, tripo_import_task_id, tripo_import_status, rigging_status, rig_type
       FROM monster_generations
       WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return notFoundResponse('Job');
    }

    const job = jobResult.rows[0];

    // Check prerequisites
    if (job.rigging_status !== 'riggable') {
      if (job.rigging_status === 'rigging') {
        return badRequestResponse('Rigging already in progress');
      }
      if (job.rigging_status === 'rigged') {
        return badRequestResponse('Model already rigged');
      }
      return badRequestResponse('Model must pass PreRigCheck before rigging');
    }

    if (!job.tripo_import_task_id) {
      return badRequestResponse('Missing Tripo import task ID');
    }

    if (!job.rig_type) {
      return badRequestResponse('Missing rig type from PreRigCheck');
    }

    // Update status to rigging
    await pool.query(
      `UPDATE monster_generations
       SET rigging_status = 'rigging'
       WHERE id = $1`,
      [jobId]
    );

    try {
      const tripoService = getTripoRiggingService();
      const s3Service = S3Service.getInstance();

      // Start rigging
      const { taskId } = await tripoService.rig({
        originalTaskId: job.tripo_import_task_id,
        outFormat,
        modelVersion,
        rigType: job.rig_type as RigType,
        spec,
      });

      // Update with task ID
      await pool.query(
        `UPDATE monster_generations
         SET rigging_task_id = $1
         WHERE id = $2`,
        [taskId, jobId]
      );

      // Wait for rigging to complete
      const rigResult = await tripoService.waitForRig(taskId, 180000);

      // Download the rigged model
      const riggedModelBuffer = await tripoService.downloadModel(rigResult.modelUrl);

      // Upload to our S3 (custom key for rigged models)
      const riggedS3Key = `models/${jobId}-rigged.glb`;
      await s3Service.uploadFile(riggedS3Key, riggedModelBuffer, 'model/gltf-binary');

      // Calculate cost
      const rigCost = calculateRiggingCost(job.rig_type as PricingRigType);

      // Update with rigged model info
      await pool.query(
        `UPDATE monster_generations
         SET rigging_status = 'rigged',
             rigged_glb_s3_key = $1,
             tripo_estimated_cost = COALESCE(tripo_estimated_cost, 0) + $2
         WHERE id = $3`,
        [riggedS3Key, rigCost, jobId]
      );

      // Generate presigned URL
      const riggedUrl = await s3Service.getPresignedUrl(riggedS3Key);

      return successResponse({
        taskId,
        riggedS3Key,
        riggedUrl,
        cost: rigCost,
        message: 'Model successfully rigged',
      });

    } catch (rigError) {
      // Update status to failed
      await pool.query(
        `UPDATE monster_generations
         SET rigging_status = 'rig_failed'
         WHERE id = $1`,
        [jobId]
      );

      throw rigError;
    }

  } catch (error) {
    logError('Admin Rigging Rig API', error);
    return internalErrorResponse(error, 'Failed to rig model');
  }
}
