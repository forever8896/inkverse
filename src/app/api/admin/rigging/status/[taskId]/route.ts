/**
 * GET /api/admin/rigging/status/[taskId]
 *
 * Poll Tripo task status.
 */

import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { successResponse, internalErrorResponse, notFoundResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { getTripoRiggingService } from '@/services/tripo-rigging-service';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return notFoundResponse('Task ID');
    }

    const tripoService = getTripoRiggingService();
    const result = await tripoService.getTaskStatus(taskId);

    return successResponse({
      taskId: result.taskId,
      status: result.status,
      progress: result.progress,
      output: result.output,
    });

  } catch (error) {
    logError('Admin Rigging Status API', error);
    return internalErrorResponse(error, 'Failed to get task status');
  }
}
