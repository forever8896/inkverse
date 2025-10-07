import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/db';

// GET /api/progress - Get user's overall progress
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get all lesson progress
    const lessonProgress = await query(`
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
    const chapterProgress = await query(`
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
    const currentPosition = await query(`
      SELECT
        lesson_id,
        chapter_id,
        step_id
      FROM user_step_progress
      WHERE user_id = $1 AND completed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    return NextResponse.json({
      lessonProgress,
      chapterProgress,
      currentPosition: currentPosition[0] || null,
    });

  } catch (error) {
    console.error('[Progress API] Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
