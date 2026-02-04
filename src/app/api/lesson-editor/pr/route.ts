/**
 * POST /api/lesson-editor/pr
 *
 * Submit lesson changes as a GitHub Pull Request.
 * Requires admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { validateLesson } from '@/lib/lesson-editor-validation';
import { submitLessonPR } from '@/lib/github-pr-service';
import { query } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Check admin role via the user table
  try {
    const { rows } = await query<{ role: string }>(
      'SELECT role FROM "user" WHERE id = $1',
      [session.user.id]
    );
    if (rows.length === 0 || rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  } catch (err) {
    console.error('[PR API] Failed to check admin role:', err);
    return NextResponse.json({ error: 'Failed to verify admin access' }, { status: 500 });
  }

  // 3. Check GitHub App configuration
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY || !process.env.GITHUB_APP_INSTALLATION_ID) {
    return NextResponse.json(
      { error: 'GitHub App not configured. Contact the repository admin.' },
      { status: 503 }
    );
  }

  // 4. Parse and validate request body
  let body: { lesson: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.lesson) {
    return NextResponse.json({ error: 'Missing lesson field in request body' }, { status: 400 });
  }

  const validation = validateLesson(body.lesson);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Lesson validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  // Use the raw input for PR content to preserve original key ordering.
  // Zod validation above ensures structure is correct.
  const lessonData = body.lesson as { id: number; title: string };

  // 5. Submit PR
  try {
    const lessonJson = JSON.stringify(body.lesson, null, 2) + '\n';
    const result = await submitLessonPR(
      lessonData.id,
      lessonData.title,
      lessonJson,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      prUrl: result.prUrl,
      prNumber: result.prNumber,
    });
  } catch (err: unknown) {
    const error = err as Error & { prUrl?: string; prNumber?: number };

    if (error.message === 'PR_ALREADY_EXISTS') {
      return NextResponse.json(
        {
          error: 'A PR already exists for this lesson',
          prUrl: error.prUrl,
          prNumber: error.prNumber,
        },
        { status: 409 }
      );
    }

    if (error.message === 'GITHUB_APP_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'GitHub App not configured. Contact the repository admin.' },
        { status: 503 }
      );
    }

    console.error('[PR API] Failed to submit PR:', error);
    return NextResponse.json(
      { error: 'Failed to create pull request. Please try again.' },
      { status: 500 }
    );
  }
}
