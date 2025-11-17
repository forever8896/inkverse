/**
 * DELETE /api/admin/jobs/[jobId]
 * Deletes a generation job and associated S3 files
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { S3Service } from '@/services/s3-service';
import { requireAdminApi } from '@/lib/admin-auth';
import {
  validateAndFetchJob,
  cleanupJobS3Files,
  ValidationError,
  NotFoundError
} from '@/lib/admin-job-helpers';

export interface DeleteJobResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function DELETE(
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

    console.log(`[ADMIN] Deleting job ${jobId} and associated files...`);

    // Delete S3 files if they exist
    const deletedFiles = await cleanupJobS3Files(job);

    // Delete the job from database
    const { getPool } = await import('@/lib/postgres');
    const pool = getPool();
    await pool.query('DELETE FROM monster_generations WHERE id = $1', [jobId]);

    console.log(`[ADMIN] Successfully deleted job ${jobId} from database`);

    const response: DeleteJobResponse = {
      success: true,
      message: `Job deleted successfully${deletedFiles.length > 0 ? ` (including ${deletedFiles.join(' and ')})` : ''}`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[ADMIN] Failed to delete job:`, error);

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

// Get job details for admin
export async function GET(
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

    // Get user info
    const { getPool } = await import('@/lib/postgres');
    const pool = getPool();
    const userResult = await pool.query(
      'SELECT name, email FROM "user" WHERE id = $1',
      [job.userId]
    );

    const user = userResult.rows[0];

    // Generate fresh presigned URLs if S3 keys exist
    const s3Service = S3Service.getInstance();
    let freshImageUrl = job.imageUrl;
    let freshGlbUrl = job.glbUrl;

    try {
      if (job.imageS3Key) {
        freshImageUrl = await s3Service.getPresignedUrl(job.imageS3Key, { expiresIn: 7200 }); // 2 hours
        console.log(`[ADMIN] Generated fresh presigned URL for image: ${job.imageS3Key}`);
      }
    } catch (error) {
      console.warn(`[ADMIN] Failed to generate presigned URL for image:`, error);
    }

    try {
      if (job.glbS3Key) {
        freshGlbUrl = await s3Service.getPresignedUrl(job.glbS3Key, { expiresIn: 7200 }); // 2 hours
        console.log(`[ADMIN] Generated fresh presigned URL for GLB: ${job.glbS3Key}`);
      }
    } catch (error) {
      console.warn(`[ADMIN] Failed to generate presigned URL for GLB:`, error);
    }

    // Fetch workflow data if run ID exists
    let workflowData = null;
    if (job.workflowRunId) {
      const { getWorkflowRunData } = await import('@/lib/workflow-data');
      workflowData = await getWorkflowRunData(job.workflowRunId);
    }

    const response = {
      success: true,
      job: {
        ...job.toJSON(),
        imageUrl: freshImageUrl,
        glbUrl: freshGlbUrl,
        userName: user?.name,
        userEmail: user?.email
      },
      workflow: workflowData, // Workflow observability data (steps, events, status)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[ADMIN] Failed to fetch job details:`, error);

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