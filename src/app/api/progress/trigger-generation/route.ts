import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/db';

// POST /api/progress/trigger-generation - Trigger NFT generation for a completed step
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
    const { lessonId, chapterId, stepId, generationJobId } = body;

    if (!lessonId || !chapterId || !stepId) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, chapterId, stepId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if generation already triggered for this step
    const existing = await query(`
      SELECT *
      FROM lesson_generation_triggers
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
        AND step_id = $4
    `, [userId, lessonId, chapterId, stepId]);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Generation already triggered for this step', trigger: existing[0] },
        { status: 409 }
      );
    }

    // Create generation trigger record
    const result = await query(`
      INSERT INTO lesson_generation_triggers (
        user_id,
        lesson_id,
        chapter_id,
        step_id,
        generation_job_id,
        completed
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, lessonId, chapterId, stepId, generationJobId || null, false]);

    return NextResponse.json({
      success: true,
      trigger: result[0],
    });

  } catch (error) {
    console.error('[Progress API] Error triggering generation:', error);
    return NextResponse.json(
      { error: 'Failed to trigger generation' },
      { status: 500 }
    );
  }
}

// GET /api/progress/trigger-generation?lessonId=1 - Get latest trigger for lesson
// GET /api/progress/trigger-generation?lessonId=1&chapterId=5&stepId=12 - Check specific step
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

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required query param: lessonId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // If all params provided, query specific step
    if (chapterId && stepId) {
      const result = await query(`
        SELECT
          lgt.*,
          mg.status as generation_status,
          mg.image_url,
          mg.glb_url,
          mg.progress as generation_progress
        FROM lesson_generation_triggers lgt
        LEFT JOIN monster_generations mg ON lgt.generation_job_id = mg.id
        WHERE lgt.user_id = $1
          AND lgt.lesson_id = $2
          AND lgt.chapter_id = $3
          AND lgt.step_id = $4
      `, [userId, parseInt(lessonId), parseInt(chapterId), parseInt(stepId)]);

      return NextResponse.json({
        triggered: result.length > 0,
        trigger: result[0] || null,
      });
    }

    // If only lessonId provided, return the most recent trigger for this lesson
    const result = await query(`
      SELECT
        lgt.*,
        mg.status as generation_status,
        mg.image_url,
        mg.glb_url,
        mg.progress as generation_progress
      FROM lesson_generation_triggers lgt
      LEFT JOIN monster_generations mg ON lgt.generation_job_id = mg.id
      WHERE lgt.user_id = $1
        AND lgt.lesson_id = $2
      ORDER BY lgt.triggered_at DESC
      LIMIT 1
    `, [userId, parseInt(lessonId)]);

    return NextResponse.json({
      triggered: result.length > 0,
      trigger: result[0] || null,
    });

  } catch (error) {
    console.error('[Progress API] Error checking generation trigger:', error);
    return NextResponse.json(
      { error: 'Failed to check generation trigger' },
      { status: 500 }
    );
  }
}

// PATCH /api/progress/trigger-generation - Update generation trigger (link job ID or mark completed)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, chapterId, stepId, generationJobId, completed } = body;

    if (!lessonId || !chapterId || !stepId) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, chapterId, stepId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const result = await query(`
      UPDATE lesson_generation_triggers
      SET
        generation_job_id = COALESCE($5, generation_job_id),
        completed = COALESCE($6, completed)
      WHERE user_id = $1
        AND lesson_id = $2
        AND chapter_id = $3
        AND step_id = $4
      RETURNING *
    `, [userId, lessonId, chapterId, stepId, generationJobId || null, completed]);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Generation trigger not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trigger: result[0],
    });

  } catch (error) {
    console.error('[Progress API] Error updating generation trigger:', error);
    return NextResponse.json(
      { error: 'Failed to update generation trigger' },
      { status: 500 }
    );
  }
}
