/**
 * GET /api/monster-status/[jobId]
 * Returns the current status and progress of a monster generation job
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob, GenerationJobData } from '@/lib/generation-job';
import { auth } from '@/lib/auth';

export interface MonsterStatusResponse {
  success: boolean;
  job?: GenerationJobData;
  processing?: boolean;
  retryInSeconds?: number;
  error?: string;
  urlFreshness?: {
    imageUrl: { fresh: boolean; expiresIn: number; canRefresh: boolean };
    glbUrl: { fresh: boolean; expiresIn: number; canRefresh: boolean };
  };
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
    let job = await GenerationJob.findById(jobId);
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

    // WORKFLOW-BASED STATUS CHECK
    let workflowStatus: string | null = null;
    let isProcessing = false;

    // Get workflow run status if available
    if (job.workflowRunId) {
      try {
        const { getRun } = await import('workflow/api');
        const run = await getRun(job.workflowRunId);
        workflowStatus = await run.status;
        isProcessing = workflowStatus === 'running';
      } catch (error) {
        console.error(`❌ [API] Failed to get workflow status:`, error);
      }
    }

    // Check if URLs need refreshing (expired presigned URLs)
    // Use lastUrlRefresh (not updatedAt) to accurately track URL age
    const now = new Date();
    const urlRefreshTime = new Date(job.lastUrlRefresh || job.updatedAt);
    const hoursSinceRefresh =
      (now.getTime() - urlRefreshTime.getTime()) / (1000 * 60 * 60);

    // Refresh URLs if they're older than 1 hour (presigned URLs expire in 2 hours)
    if (hoursSinceRefresh > 1 && (job.imageUrl || job.glbUrl)) {
      try {
        await job.refreshUrls();
        console.log(`[API] Refreshed URLs for job ${jobId}`);
      } catch (error) {
        console.error(`[API] Failed to refresh URLs for job ${jobId}:`, error);
        // Don't fail the request - return existing URLs even if they might be expired
      }
    }

    // Recalculate freshness for response
    // Use lastUrlRefresh if available, otherwise fall back to updatedAt (Fix #5)
    const refreshBaseTime = job.lastUrlRefresh || job.updatedAt;
    const finalUpdatedAt = new Date(refreshBaseTime);
    const finalAge = (Date.now() - finalUpdatedAt.getTime()) / (1000 * 60 * 60);
    
    const urlFreshness = {
      imageUrl: {
        fresh: finalAge < 1,
        expiresIn: Math.max(0, Math.round((2 - finalAge) * 60)), // Minutes
        canRefresh: !!job.imageS3Key
      },
      glbUrl: {
        fresh: finalAge < 1,
        expiresIn: Math.max(0, Math.round((2 - finalAge) * 60)),
        canRefresh: !!job.glbS3Key
      }
    };

    // Return job data with processing status
    const response: MonsterStatusResponse = {
      success: true,
      job: job.toJSON(),
      processing: isProcessing,
      urlFreshness
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
