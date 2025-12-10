import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';

// GET /api/progress - Get user's overall progress
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;

    // Get all lesson progress
    const { rows: lessonProgress } = await query(`
      SELECT
        lesson_id,
        started_at,
        completed_at,
        current_chapter_id,
        evolution_stage
      FROM user_lesson_progress
      WHERE user_id = $1
      ORDER BY lesson_id ASC
    `, [userId]);

    // Get all chapter progress
    const { rows: chapterProgress } = await query(`
      SELECT
        lesson_id,
        chapter_id,
        started_at,
        completed_at,
        current_step_id
      FROM user_chapter_progress
      WHERE user_id = $1
      ORDER BY lesson_id ASC, chapter_id ASC
    `, [userId]);

    // Get current position (most recent incomplete step)
    const { rows: currentPositionRows } = await query(`
      SELECT
        lesson_id,
        chapter_id,
        step_id
      FROM user_step_progress
      WHERE user_id = $1 AND completed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    return successResponse({
      lessonProgress,
      chapterProgress,
      currentPosition: currentPositionRows[0] || null,
    });

  } catch (error) {
    logError('Progress API', error);
    return internalErrorResponse(error, 'Failed to fetch progress');
  }
}