import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { parseIntSafe, validateCode } from '@/lib/validation';
import { successResponse, badRequestResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { getLessonById } from '@/lib/lessons-server';

// POST /api/progress/step - Save step progress
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      lessonId,
      chapterId,
      stepId,
      contractCode,
      completed,
      validationPassed,
    } = body;

    // Validate required fields
    if (!lessonId || !chapterId || !stepId) {
      return badRequestResponse('Missing required fields: lessonId, chapterId, stepId');
    }

    // Validate lesson/chapter/step exist in content
    const lesson = getLessonById(Number(lessonId));
    if (!lesson) {
      return badRequestResponse(`Lesson ${lessonId} does not exist`);
    }

    const chapter = lesson.chapters?.find(c => c.id === Number(chapterId));
    if (!chapter) {
      return badRequestResponse(`Chapter ${chapterId} does not exist in lesson ${lessonId}`);
    }

    const step = chapter.steps.find(s => s.id === Number(stepId));
    if (!step) {
      return badRequestResponse(`Step ${stepId} does not exist in chapter ${chapterId}`);
    }

    // Server-side code validation: if step has validation rules, verify the code
    let serverValidationPassed = validationPassed || false;
    if (step.validation && step.validation.length > 0) {
      if (completed && !contractCode) {
        return badRequestResponse('Contract code is required for validation steps');
      }
      if (contractCode) {
        serverValidationPassed = validateCode(contractCode, step.validation);
      }
    }

    const userId = session.user.id;

    // Check prerequisite: all previous steps in the same chapter must be completed
    const currentStepId = Number(stepId);
    if (completed && currentStepId > 1) {
      const previousStepIds = chapter.steps
        .filter(s => s.id < currentStepId)
        .map(s => s.id);

      if (previousStepIds.length > 0) {
        const { rows: completedPrevious } = await query(`
          SELECT COUNT(*) as count
          FROM user_step_progress
          WHERE user_id = $1
            AND lesson_id = $2
            AND chapter_id = $3
            AND step_id = ANY($4::int[])
            AND completed_at IS NOT NULL
        `, [userId, lessonId, chapterId, previousStepIds]);

        const completedCount = parseInt(completedPrevious[0]?.count || '0', 10);
        if (completedCount < previousStepIds.length) {
          return badRequestResponse('Previous steps must be completed first');
        }
      }
    }

    // For the first step of chapters > 1, verify the previous chapter is completed
    if (completed && Number(chapterId) > 1 && currentStepId === chapter.steps[0]?.id) {
      const prevChapterId = Number(chapterId) - 1;
      const { rows: prevChapter } = await query(`
        SELECT completed_at
        FROM user_chapter_progress
        WHERE user_id = $1
          AND lesson_id = $2
          AND chapter_id = $3
          AND completed_at IS NOT NULL
      `, [userId, lessonId, prevChapterId]);

      if (prevChapter.length === 0) {
        return badRequestResponse('Previous chapter must be completed first');
      }
    }

    // Upsert step progress
    const { rows } = await query(`
      INSERT INTO user_step_progress (
        user_id,
        lesson_id,
        chapter_id,
        step_id,
        contract_code,
        completed_at,
        validation_passed,
        attempts
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      ON CONFLICT (user_id, lesson_id, chapter_id, step_id)
      DO UPDATE SET
        contract_code = EXCLUDED.contract_code,
        completed_at = CASE
          WHEN $6 IS NOT NULL THEN EXCLUDED.completed_at
          ELSE user_step_progress.completed_at
        END,
        validation_passed = EXCLUDED.validation_passed,
        attempts = user_step_progress.attempts + 1,
        updated_at = NOW()
      RETURNING *
    `, [
      userId,
      lessonId,
      chapterId,
      stepId,
      contractCode || null,
      completed ? new Date().toISOString() : null,
      serverValidationPassed,
    ]);

    // If step is completed, update chapter progress
    if (completed) {
      await query(`
        INSERT INTO user_chapter_progress (
          user_id,
          lesson_id,
          chapter_id,
          current_step_id
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, lesson_id, chapter_id)
        DO UPDATE SET
          current_step_id = EXCLUDED.current_step_id,
          updated_at = NOW()
      `, [userId, lessonId, chapterId, stepId]);

      // Update lesson progress
      await query(`
        INSERT INTO user_lesson_progress (
          user_id,
          lesson_id,
          current_chapter_id
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET
          current_chapter_id = EXCLUDED.current_chapter_id,
          updated_at = NOW()
      `, [userId, lessonId, chapterId]);
    }

    return successResponse({ progress: rows[0] });

  } catch (error) {
    logError('Progress Step API POST', error);
    return internalErrorResponse(error, 'Failed to save step progress');
  }
}

// GET /api/progress/step?lessonId=1&chapterId=1&stepId=1 - Get specific step progress
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const lessonId = parseIntSafe(searchParams.get('lessonId'));
    const chapterId = parseIntSafe(searchParams.get('chapterId'));
    const stepId = parseIntSafe(searchParams.get('stepId'));

    if (lessonId === null || chapterId === null || stepId === null) {
      return badRequestResponse('Missing or invalid query params: lessonId, chapterId, stepId');
    }

    const userId = session.user.id;

    const { rows } = await query(`
      SELECT *
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
        AND step_id = $4
    `, [userId, lessonId, chapterId, stepId]);

    return successResponse({ progress: rows[0] || null });

  } catch (error) {
    logError('Progress Step API GET', error);
    return internalErrorResponse(error, 'Failed to fetch step progress');
  }
}