/**
 * GET /api/monster-status/[jobId]
 * Returns the current status and progress of a monster generation job
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob, GenerationJobData } from '@/lib/generation-job';
import { JobProcessor } from '@/lib/job-processor';
import { auth } from '@/lib/auth';

export interface MonsterStatusResponse {
  success: boolean;
  job?: GenerationJobData;
  processing?: boolean;
  retryInSeconds?: number;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate job ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Find the job
    const job = await GenerationJob.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get current user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user owns this job or is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied - job belongs to another user',
        },
        { status: 403 }
      );
    }

    // POLLING-TRIGGERED JOB PROCESSING
    // If job is pending or ready for retry, start processing immediately
    let isProcessing = false;
    let retryInSeconds = 0;

    console.log(`🔄 [API] ========================================`);
    console.log(`🔄 [API] POLLING STATUS CHECK`);
    console.log(`🔄 [API] Job ID: ${jobId}`);
    console.log(`🔄 [API] User ID: ${session.user.id}`);
    console.log(`🔄 [API] Current Status: ${job.status}`);
    console.log(`🔄 [API] Current Progress: ${job.progress}%`);
    console.log(`🔄 [API] Retry Count: ${job.retryCount}`);
    console.log(`🔄 [API] ========================================`);

    const jobProcessor = JobProcessor.getInstance();

    // Check if job is stuck in retrying state (processor died/timed out)
    if (
      job.status === 'image_generation_retrying' ||
      job.status === 'conversion_retrying'
    ) {
      const timeSinceUpdate =
        (Date.now() - new Date(job.updatedAt).getTime()) / 1000;
      const TIMEOUT_SECONDS = 300; // 5 minutes

      console.log(`⏱️  [API] Job in retrying state - checking timeout...`);
      console.log(
        `⏱️  [API] Time since last update: ${Math.floor(timeSinceUpdate)}s`
      );
      console.log(`⏱️  [API] Timeout threshold: ${TIMEOUT_SECONDS}s`);

      if (timeSinceUpdate > TIMEOUT_SECONDS) {
        // Job stuck in retrying state - mark as failed so it can be retried
        const failedStatus = job.status.includes('image')
          ? 'image_generation_failed'
          : 'conversion_failed';
        console.log(`⚠️  [API] Job TIMED OUT in retrying state!`);
        console.log(
          `⚠️  [API] → Changing status: ${job.status} → ${failedStatus}`
        );

        await job.update({
          status: failedStatus as any,
          userMessage: 'Processing timed out - retrying now...',
        });

        console.log(
          `✅ [API] → Status updated, job can now be picked up for retry`
        );
      } else {
        console.log(
          `✅ [API] Job still within timeout window (${Math.floor(TIMEOUT_SECONDS - timeSinceUpdate)}s remaining)`
        );
      }
    }

    if (job.status === 'pending') {
      console.log(
        `🚀 [API] Job is PENDING - attempting to start processing...`
      );

      // Try to atomically start the job (prevents race conditions)
      try {
        const startedJob = await GenerationJob.atomicStart(jobId);
        if (startedJob) {
          console.log(
            `✅ [API] → SUCCESSFULLY STARTED job processing for ${jobId}`
          );
          console.log(
            `✅ [API] → Job status changed: pending → ${startedJob.status}`
          );
          isProcessing = true;

          // Start async processing (don't await - let it run in background)
          console.log(`🎭 [API] → Launching background job processor...`);
          jobProcessor.processJob(startedJob).catch((error) => {
            console.error(
              `❌ [API] Background job processing failed for ${jobId}:`,
              error
            );
          });

          // Update our job reference to the started job
          Object.assign(job, startedJob);
        } else {
          console.log(
            `⚠️  [API] → Job could not be started (already started by another request)`
          );
        }
      } catch (error) {
        console.error(`❌ [API] Failed to start job ${jobId}:`, error);
      }
    } else if (
      (job.status === 'image_generation_failed' ||
        job.status === 'conversion_failed' ||
        job.status === 'image_generation_retrying' ||
        job.status === 'conversion_retrying') &&
      jobProcessor.canRetryNow(job)
    ) {
      // Job can be retried now
      console.log(
        `🔄 [API] Job has FAILED/RETRYING and can retry NOW - restarting processing...`
      );
      console.log(`🔄 [API] Failed status: ${job.status}`);
      console.log(`🔄 [API] Can retry: ${job.canRetry()}`);
      console.log(
        `🔄 [API] Seconds until retry: ${job.getSecondsUntilRetry()}`
      );
      isProcessing = true;

      // Start async retry processing
      console.log(`🎭 [API] → Launching retry job processor...`);
      jobProcessor.processJob(job).catch((error) => {
        console.error(
          `❌ [API] Background job retry failed for ${jobId}:`,
          error
        );
      });
    } else if (job.canRetry()) {
      // Job can be retried but we need to wait
      retryInSeconds = job.getSecondsUntilRetry();
      console.log(
        `⏳ [API] Job can retry but must wait ${retryInSeconds} more seconds`
      );
      console.log(`⏳ [API] Job status: ${job.status}`);
      console.log(`⏳ [API] Last error: ${job.lastError?.type || 'none'}`);
    } else if (job.status === 'completed') {
      console.log(`🎉 [API] Job is completed!`);
      console.log(
        `🎉 [API] → Image URL: ${job.imageUrl ? 'present' : 'missing'}`
      );
      console.log(`🎉 [API] → GLB URL: ${job.glbUrl ? 'present' : 'missing'}`);
      console.log(`🎉 [API] → Total cost: $${job.totalCost}`);

      // Check if completed job is missing files (due to storage issues)
      if (!job.imageUrl || !job.glbUrl) {
        console.log(
          `⚠️ [API] COMPLETED job has missing files - attempting restart...`
        );
        console.log(`⚠️ [API] → Missing image URL: ${!job.imageUrl}`);
        console.log(`⚠️ [API] → Missing GLB URL: ${!job.glbUrl}`);

        try {
          // Reset job to pending state to restart generation
          await job.update({
            status: 'pending',
            progress: 0,
            imageUrl: undefined,
            glbUrl: undefined,
            imageS3Key: undefined,
            glbS3Key: undefined,
            errorMessage: undefined,
            userMessage: 'Restarting generation due to missing files',
            retryCount: (job.retryCount || 0) + 1,
            lastError: undefined,
          });

          console.log(
            `🔄 [API] → Successfully reset job to PENDING for restart`
          );
          console.log(`🔄 [API] → Retry count: ${(job.retryCount || 0) + 1}`);

          // Start processing immediately
          isProcessing = true;
          console.log(`🎭 [API] → Launching restart job processor...`);
          jobProcessor.processJob(job).catch((error) => {
            console.error(
              `❌ [API] Background job restart failed for ${jobId}:`,
              error
            );
          });
        } catch (error) {
          console.error(
            `❌ [API] Failed to restart completed job with missing files:`,
            error
          );
        }
      }
    } else {
      console.log(`📊 [API] Job status: ${job.status} (no action needed)`);
    }

    // Check if URLs need refreshing (expired presigned URLs)
    const now = new Date();
    const updatedAt = new Date(job.updatedAt);
    const hoursSinceUpdate =
      (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    // Refresh URLs if they're older than 1 hour (presigned URLs expire in 2 hours)
    if (hoursSinceUpdate > 1 && (job.imageUrl || job.glbUrl)) {
      try {
        await job.refreshUrls();
        console.log(`[API] Refreshed URLs for job ${jobId}`);
      } catch (error) {
        console.error(`[API] Failed to refresh URLs for job ${jobId}:`, error);
        // Don't fail the request - return existing URLs even if they might be expired
      }
    }

    // Return job data with processing status
    const response: MonsterStatusResponse = {
      success: true,
      job: job.toJSON(),
      processing: isProcessing,
      ...(retryInSeconds > 0 && { retryInSeconds }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Monster status error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For development - show API info on other methods
export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
      endpoint: 'GET /api/monster-status/[jobId]',
      description: 'Get the status and progress of a monster generation job',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
      endpoint: 'GET /api/monster-status/[jobId]',
      description: 'Get the status and progress of a monster generation job',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods: ['GET'],
      endpoint: 'GET /api/monster-status/[jobId]',
      description: 'Get the status and progress of a monster generation job',
    },
    { status: 405 }
  );
}
