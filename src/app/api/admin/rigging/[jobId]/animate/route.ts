/**
 * POST /api/admin/rigging/[jobId]/animate
 *
 * Apply animation preset to a rigged model.
 */

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse, notFoundResponse, badRequestResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { S3Service } from '@/services/s3-service';
import { getTripoRiggingService, OutputFormat } from '@/services/tripo-rigging-service';
import { calculateAnimationCost, TRIPO_ANIMATION_PRESETS, RigType } from '@/config/pricing';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

interface AnimateRequestBody {
  animation?: string;
  animations?: string[];
  bakeAnimation?: boolean;
  animateInPlace?: boolean;
  outFormat?: OutputFormat;
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { jobId } = await context.params;
    const pool = getPool();

    // Parse request body
    const body: AnimateRequestBody = await request.json();

    const {
      animation,
      animations,
      bakeAnimation = true,
      animateInPlace = false,
      outFormat = 'glb',
    } = body;

    // Validate animation input
    if (!animation && (!animations || animations.length === 0)) {
      return badRequestResponse('Either animation or animations must be provided');
    }

    if (animations && animations.length > 5) {
      return badRequestResponse('Maximum 5 animations allowed');
    }

    // Get job details
    const jobResult = await pool.query(
      `SELECT id, user_id, rigging_task_id, rigging_status, rig_type
       FROM monster_generations
       WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return notFoundResponse('Job');
    }

    const job = jobResult.rows[0];

    // Check prerequisites
    if (job.rigging_status !== 'rigged' && job.rigging_status !== 'animated') {
      if (job.rigging_status === 'animating') {
        return badRequestResponse('Animation already in progress');
      }
      return badRequestResponse('Model must be rigged before animating');
    }

    if (!job.rigging_task_id) {
      return badRequestResponse('Missing rigging task ID');
    }

    // Validate animation presets for rig type
    const rigType = job.rig_type as RigType;
    const availablePresets: readonly string[] = TRIPO_ANIMATION_PRESETS[rigType] || [];
    const requestedAnimations = animations || [animation!];

    for (const anim of requestedAnimations) {
      if (!availablePresets.includes(anim)) {
        return badRequestResponse(
          `Animation '${anim}' not available for rig type '${rigType}'. Available: ${availablePresets.join(', ') || 'none'}`
        );
      }
    }

    // Update status to animating
    await pool.query(
      `UPDATE monster_generations
       SET rigging_status = 'animating'
       WHERE id = $1`,
      [jobId]
    );

    try {
      const tripoService = getTripoRiggingService();
      const s3Service = S3Service.getInstance();

      // Start animation (retarget)
      const { taskId } = await tripoService.retarget({
        rigTaskId: job.rigging_task_id,
        outFormat,
        animation: animations ? undefined : animation,
        animations: animations,
        bakeAnimation,
        animateInPlace,
      });

      // Update with task ID
      await pool.query(
        `UPDATE monster_generations
         SET animation_task_id = $1
         WHERE id = $2`,
        [taskId, jobId]
      );

      // Wait for animation to complete
      const animResult = await tripoService.waitForRetarget(taskId, 180000);

      // Download the animated model
      const animatedModelBuffer = await tripoService.downloadModel(animResult.modelUrl);

      // Upload to our S3 (custom key for animated models)
      const animatedS3Key = `models/${jobId}-animated.glb`;
      await s3Service.uploadFile(animatedS3Key, animatedModelBuffer, 'model/gltf-binary');

      // Calculate cost
      const animCost = calculateAnimationCost(requestedAnimations.length);

      // Update with animated model info
      const animationPreset = requestedAnimations.join(',');
      await pool.query(
        `UPDATE monster_generations
         SET rigging_status = 'animated',
             animated_glb_s3_key = $1,
             animation_preset = $2,
             tripo_estimated_cost = COALESCE(tripo_estimated_cost, 0) + $3,
             rigging_completed_at = NOW()
         WHERE id = $4`,
        [animatedS3Key, animationPreset, animCost, jobId]
      );

      // Generate presigned URL
      const animatedUrl = await s3Service.getPresignedUrl(animatedS3Key);

      return successResponse({
        taskId,
        animatedS3Key,
        animatedUrl,
        animationPreset,
        cost: animCost,
        message: 'Animation successfully applied',
      });

    } catch (animError) {
      // Update status to failed
      await pool.query(
        `UPDATE monster_generations
         SET rigging_status = 'animation_failed'
         WHERE id = $1`,
        [jobId]
      );

      throw animError;
    }

  } catch (error) {
    logError('Admin Rigging Animate API', error);
    return internalErrorResponse(error, 'Failed to animate model');
  }
}
