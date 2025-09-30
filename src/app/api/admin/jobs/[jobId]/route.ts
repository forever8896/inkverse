/**
 * DELETE /api/admin/jobs/[jobId]
 * Deletes a generation job and associated S3 files
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { S3Service } from '@/services/s3-service';
import { requireAdminApi } from '@/lib/admin-auth';

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

    console.log(`[ADMIN] Deleting job ${jobId} and associated files...`);

    // Delete S3 files if they exist
    const s3Service = S3Service.getInstance();
    const deletedFiles: string[] = [];

    try {
      if (job.imageS3Key) {
        await s3Service.deleteFile(job.imageS3Key);
        deletedFiles.push('image');
        console.log(`[ADMIN] Deleted S3 image: ${job.imageS3Key}`);
      }
    } catch (error) {
      console.warn(`[ADMIN] Failed to delete image S3 file: ${error}`);
    }

    try {
      if (job.glbS3Key) {
        await s3Service.deleteFile(job.glbS3Key);
        deletedFiles.push('3D model');
        console.log(`[ADMIN] Deleted S3 GLB: ${job.glbS3Key}`);
      }
    } catch (error) {
      console.warn(`[ADMIN] Failed to delete GLB S3 file: ${error}`);
    }

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

    const response = {
      success: true,
      job: {
        ...job.toJSON(),
        imageUrl: freshImageUrl,
        glbUrl: freshGlbUrl,
        userName: user?.name,
        userEmail: user?.email
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[ADMIN] Failed to fetch job details:`, error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}