/**
 * POST /api/admin/jobs/[jobId]/reset
 * Resets a job back to pending status, clearing errors and retry counters
 * Useful for stuck jobs that need manual intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { requireAdminApi } from '@/lib/admin-auth';

export interface ResetJobResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { jobId } = await params;

    // Validate job ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

    // Don't allow resetting already completed jobs
    if (job.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot reset completed jobs' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN] Resetting job ${jobId} from status ${job.status} to pending`);

    // Reset job to pending state, clearing all error information
    await job.update({
      status: 'pending',
      progress: 0,
      errorMessage: undefined,
      userMessage: 'Job reset by admin - restarting processing...',
      lastError: undefined,
      // Note: We keep retryCount to track total attempts across resets
    });

    console.log(`[ADMIN] Successfully reset job ${jobId} to pending`);

    const response: ResetJobResponse = {
      success: true,
      message: 'Job reset to pending status. Processing will restart automatically.'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[ADMIN] Failed to reset job:`, error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
