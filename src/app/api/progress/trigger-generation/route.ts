import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { parseIntSafe } from '@/lib/validation';

async function assertJobOwnership(userId: string, jobId: string): Promise<boolean> {
  const { rows } = await query<{ user_id: string }>(
    `SELECT user_id FROM monster_generations WHERE id = $1`,
    [jobId]
  );
  return rows.length > 0 && rows[0].user_id === userId;
}

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
    const { lessonId, chapterId, stepId, generationJobId, stage } = body;

    if (!lessonId || !chapterId || !stepId) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, chapterId, stepId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    if (generationJobId) {
      const ownsJob = await assertJobOwnership(userId, generationJobId);
      if (!ownsJob) {
        return NextResponse.json(
          { error: 'Invalid generation job' },
          { status: 403 }
        );
      }
    }

    // Atomic insert or update
    // Uses xmax = 0 check to distinguish between insert and update
    const { rows } = await query(`
      INSERT INTO lesson_generation_triggers (
        user_id,
        lesson_id,
        chapter_id,
        step_id,
        generation_job_id,
        stage,
        completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, lesson_id, chapter_id, step_id)
      DO UPDATE SET
        generation_job_id = COALESCE(lesson_generation_triggers.generation_job_id, EXCLUDED.generation_job_id),
        stage = COALESCE(lesson_generation_triggers.stage, EXCLUDED.stage)
      RETURNING *, (xmax = 0) AS was_inserted
    `, [userId, lessonId, chapterId, stepId, generationJobId || null, stage || null, false]);

    const trigger = rows[0];
    const wasInserted = trigger.was_inserted;
    
    // If updated (not inserted) and job ID didn't change (was already set), then it's a duplicate
    if (!wasInserted && trigger.generation_job_id && generationJobId && trigger.generation_job_id === generationJobId) {
      return NextResponse.json(
        { error: 'Generation already triggered for this step', trigger },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      trigger: trigger,
      isNew: wasInserted
    }, { status: wasInserted ? 201 : 200 });

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
    const lessonId = parseIntSafe(searchParams.get('lessonId'));
    const chapterId = parseIntSafe(searchParams.get('chapterId'));
    const stepId = parseIntSafe(searchParams.get('stepId'));
    const stage = searchParams.get('stage');

    if (lessonId === null) {
      return NextResponse.json(
        { error: 'Missing or invalid query param: lessonId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // If all params provided, query specific step
    if (chapterId !== null && stepId !== null) {
      const { rows } = await query(`
        SELECT
          lgt.*,
          mg.status as generation_status,
          mg.image_url,
          mg.glb_url,
          mg.progress as generation_progress
        FROM lesson_generation_triggers lgt
        LEFT JOIN monster_generations mg 
          ON lgt.generation_job_id = mg.id
          AND mg.user_id = lgt.user_id
        WHERE lgt.user_id = $1
          AND lgt.lesson_id = $2
          AND lgt.chapter_id = $3
          AND lgt.step_id = $4
      `, [userId, lessonId, chapterId, stepId]);

      return NextResponse.json({
        triggered: rows.length > 0,
        trigger: rows[0] || null,
      });
    }

    // If only lessonId provided, return the most relevant trigger for this lesson.
    // Prefer active (processing) jobs over terminal (completed/failed) ones,
    // so users reconnect to in-flight generations after page navigation.
    // If stage is provided, filter by it (Fix #3)
    let queryText = `
      SELECT
        lgt.*,
        mg.status as generation_status,
        mg.image_url,
        mg.glb_url,
        mg.progress as generation_progress
      FROM lesson_generation_triggers lgt
      LEFT JOIN monster_generations mg
        ON lgt.generation_job_id = mg.id
        AND mg.user_id = lgt.user_id
      WHERE lgt.user_id = $1
        AND lgt.lesson_id = $2
    `;

    const queryParams: (string | number)[] = [userId, lessonId];

    if (stage) {
      queryText += ` AND lgt.stage = $3`;
      queryParams.push(stage);
    }

    // Active/processing jobs get priority over terminal ones.
    // Among terminal jobs, prefer the most recently updated (freshest URLs).
    // Use IS NULL check + completed/failed to avoid enum mismatch errors.
    queryText += `
      ORDER BY
        CASE WHEN mg.status IS NULL
          OR mg.status IN (
            'completed', 'failed', 'failed_permanent',
            'image_generation_failed', 'conversion_failed',
            'nft_minting_failed', 'prerequisites_failed'
          ) THEN 1 ELSE 0 END,
        COALESCE(mg.updated_at, lgt.triggered_at) DESC
      LIMIT 1`;

    const { rows } = await query(queryText, queryParams);

    return NextResponse.json({
      triggered: rows.length > 0,
      trigger: rows[0] || null,
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

    if (generationJobId) {
      const ownsJob = await assertJobOwnership(userId, generationJobId);
      if (!ownsJob) {
        return NextResponse.json(
          { error: 'Invalid generation job' },
          { status: 403 }
        );
      }
    }

    const { rows } = await query(`
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

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Generation trigger not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trigger: rows[0],
    });

  } catch (error) {
    console.error('[Progress API] Error updating generation trigger:', error);
    return NextResponse.json(
      { error: 'Failed to update generation trigger' },
      { status: 500 }
    );
  }
}
