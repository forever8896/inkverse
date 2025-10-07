import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/db';

// POST /api/progress/step - Save step progress
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, chapterId, stepId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Upsert step progress
    const result = await query(`
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
      validationPassed || false,
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

    return NextResponse.json({
      success: true,
      progress: result[0],
    });

  } catch (error) {
    console.error('[Progress API] Error saving step progress:', error);
    return NextResponse.json(
      { error: 'Failed to save step progress' },
      { status: 500 }
    );
  }
}

// GET /api/progress/step?lessonId=1&chapterId=1&stepId=1 - Get specific step progress
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const chapterId = searchParams.get('chapterId');
    const stepId = searchParams.get('stepId');

    if (!lessonId || !chapterId || !stepId) {
      return NextResponse.json(
        { error: 'Missing required query params: lessonId, chapterId, stepId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const result = await query(`
      SELECT *
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
        AND step_id = $4
    `, [userId, parseInt(lessonId), parseInt(chapterId), parseInt(stepId)]);

    return NextResponse.json({
      progress: result[0] || null,
    });

  } catch (error) {
    console.error('[Progress API] Error fetching step progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch step progress' },
      { status: 500 }
    );
  }
}
