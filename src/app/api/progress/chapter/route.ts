import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { parseIntSafe } from '@/lib/validation';
import { successResponse, badRequestResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { getLessonById } from '@/lib/lessons-server';

// POST /api/progress/chapter - Mark chapter as completed
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { lessonId, chapterId } = body;

    if (!lessonId || !chapterId) {
      return badRequestResponse('Missing required fields: lessonId, chapterId');
    }

    // Validate lesson and chapter exist in content
    const lesson = getLessonById(Number(lessonId));
    if (!lesson) {
      return badRequestResponse(`Lesson ${lessonId} does not exist`);
    }

    const chapter = lesson.chapters?.find(c => c.id === Number(chapterId));
    if (!chapter) {
      return badRequestResponse(`Chapter ${chapterId} does not exist in lesson ${lessonId}`);
    }

    const userId = session.user.id;

    // Verify all steps in the chapter are completed before allowing chapter completion
    const totalSteps = chapter.steps.length;
    const { rows: completedSteps } = await query(`
      SELECT COUNT(*) as count
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
        AND completed_at IS NOT NULL
    `, [userId, lessonId, chapterId]);

    const completedCount = parseInt(completedSteps[0]?.count || '0', 10);
    if (completedCount < totalSteps) {
      return badRequestResponse(`Cannot complete chapter: ${completedCount}/${totalSteps} steps completed`);
    }

    // Mark chapter as completed
    const { rows } = await query(`
      INSERT INTO user_chapter_progress (
        user_id,
        lesson_id,
        chapter_id,
        completed_at
      )
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, lesson_id, chapter_id)
      DO UPDATE SET
        completed_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [userId, lessonId, chapterId]);

    return successResponse({ progress: rows[0] });

  } catch (error) {
    logError('Progress Chapter API POST', error);
    return internalErrorResponse(error, 'Failed to complete chapter');
  }
}

// GET /api/progress/chapter?lessonId=1&chapterId=1 - Get chapter progress
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const lessonId = parseIntSafe(searchParams.get('lessonId'));
    const chapterId = parseIntSafe(searchParams.get('chapterId'));

    if (lessonId === null || chapterId === null) {
      return badRequestResponse('Missing or invalid query params: lessonId, chapterId');
    }

    const userId = session.user.id;

    // Get chapter progress
    const { rows: chapterRows } = await query(`
      SELECT *
      FROM user_chapter_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
    `, [userId, lessonId, chapterId]);

    // Get all steps progress for this chapter
    const { rows: stepsRows } = await query(`
      SELECT *
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
      ORDER BY step_id ASC
    `, [userId, lessonId, chapterId]);

    return successResponse({
      chapter: chapterRows[0] || null,
      steps: stepsRows,
    });

  } catch (error) {
    logError('Progress Chapter API GET', error);
    return internalErrorResponse(error, 'Failed to fetch chapter progress');
  }
}