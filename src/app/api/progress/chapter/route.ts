import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/db';

// POST /api/progress/chapter - Mark chapter as completed
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
    const { lessonId, chapterId } = body;

    if (!lessonId || !chapterId) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, chapterId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Mark chapter as completed
    const result = await query(`
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

    return NextResponse.json({
      success: true,
      progress: result[0],
    });

  } catch (error) {
    console.error('[Progress API] Error completing chapter:', error);
    return NextResponse.json(
      { error: 'Failed to complete chapter' },
      { status: 500 }
    );
  }
}

// GET /api/progress/chapter?lessonId=1&chapterId=1 - Get chapter progress
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

    if (!lessonId || !chapterId) {
      return NextResponse.json(
        { error: 'Missing required query params: lessonId, chapterId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get chapter progress
    const chapterResult = await query(`
      SELECT *
      FROM user_chapter_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
    `, [userId, parseInt(lessonId), parseInt(chapterId)]);

    // Get all steps progress for this chapter
    const stepsResult = await query(`
      SELECT *
      FROM user_step_progress
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
      ORDER BY step_id ASC
    `, [userId, parseInt(lessonId), parseInt(chapterId)]);

    return NextResponse.json({
      chapter: chapterResult[0] || null,
      steps: stepsResult,
    });

  } catch (error) {
    console.error('[Progress API] Error fetching chapter progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter progress' },
      { status: 500 }
    );
  }
}
