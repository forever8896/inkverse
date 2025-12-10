import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { parseIntSafe } from '@/lib/validation';
import { successResponse, badRequestResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';

// POST /api/progress/lesson - Mark lesson as completed
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { lessonId, evolutionStage } = body;

    if (!lessonId) {
      return badRequestResponse('Missing required field: lessonId');
    }

    const userId = session.user.id;

    // Mark lesson as completed
    const { rows } = await query(`
      INSERT INTO user_lesson_progress (
        user_id,
        lesson_id,
        completed_at,
        evolution_stage
      )
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        completed_at = NOW(),
        evolution_stage = COALESCE(EXCLUDED.evolution_stage, user_lesson_progress.evolution_stage),
        updated_at = NOW()
      RETURNING *
    `, [userId, lessonId, evolutionStage || 'creature']);

    return successResponse({ progress: rows[0] });

  } catch (error) {
    logError('Progress Lesson API POST', error);
    return internalErrorResponse(error, 'Failed to complete lesson');
  }
}

// GET /api/progress/lesson?lessonId=1 - Get lesson progress with all chapters and steps
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const lessonIdParam = searchParams.get('lessonId');
    const lessonId = parseIntSafe(lessonIdParam);

    if (lessonId === null) {
      return badRequestResponse('Missing or invalid query param: lessonId');
    }

    const userId = session.user.id;

    // Get lesson progress
    const { rows: lessonRows } = await query(`
      SELECT *
      FROM user_lesson_progress
      WHERE user_id = $1
        AND lesson_id = $2
    `, [userId, lessonId]);

    // Get all chapters progress
    const { rows: chaptersRows } = await query(`
      SELECT *
      FROM user_chapter_progress
      WHERE user_id = $1
        AND lesson_id = $2
      ORDER BY chapter_id ASC
    `, [userId, lessonId]);

    // Get all steps progress
    const { rows: stepsRows } = await query(`
      SELECT *
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
      ORDER BY chapter_id ASC, step_id ASC
    `, [userId, lessonId]);

    return successResponse({
      lesson: lessonRows[0] || null,
      chapters: chaptersRows,
      steps: stepsRows,
    });

  } catch (error) {
    logError('Progress Lesson API GET', error);
    return internalErrorResponse(error, 'Failed to fetch lesson progress');
  }
}