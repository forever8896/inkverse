import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { parseIntSafe } from '@/lib/validation';

// POST /api/progress/lesson - Mark lesson as completed
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
    const { lessonId, evolutionStage } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required field: lessonId' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      progress: rows[0],
    });

  } catch (error) {
    console.error('[Progress API] Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

// GET /api/progress/lesson?lessonId=1 - Get lesson progress with all chapters and steps
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
    const lessonIdParam = searchParams.get('lessonId');
    const lessonId = parseIntSafe(lessonIdParam);

    if (lessonId === null) {
      return NextResponse.json(
        { error: 'Missing or invalid query param: lessonId' },
        { status: 400 }
      );
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

    return NextResponse.json({
      lesson: lessonRows[0] || null,
      chapters: chaptersRows,
      steps: stepsRows,
    });

  } catch (error) {
    console.error('[Progress API] Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}