/**
 * POST /api/admin/jobs/[jobId]/reset
 * Resets a job back to pending status, clearing errors and retry counters
 * Useful for stuck jobs that need manual intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { requireAdminApi } from '@/lib/admin-auth';
import {
  validateAndFetchJob,
  ValidationError,
  NotFoundError
} from '@/lib/admin-job-helpers';

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

    // Validate and fetch job (throws ValidationError or NotFoundError)
    const job = await validateAndFetchJob(jobId);

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

    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Handle not found errors
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
