/**
 * TEST ONLY - Trigger workflow without authentication
 * DELETE THIS FILE BEFORE PRODUCTION
 */

import { NextResponse } from 'next/server';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { start } = await import('workflow/api');
    const { generateMonster } = await import('@/workflows/generate-monster');

    const testInput = {
      jobId: `test-${Date.now()}`,
      userId: 'test-user-001',
      prompt: 'A cute purple dragon with sparkly eyes and tiny wings, pixel art style',
      generationType: 'image_only' as const
    };

    console.log('🧪 [TEST] Starting test workflow with input:', testInput);

    const run = await start(generateMonster, [testInput]);

    console.log('✅ [TEST] Workflow started with runId:', run.runId);

    return NextResponse.json({
      success: true,
      runId: run.runId,
      input: testInput
    });
  } catch (error: any) {
    console.error('❌ [TEST] Workflow error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/test-workflow',
    description: 'Test endpoint to trigger workflow without auth (dev only)',
    warning: 'DELETE THIS FILE BEFORE PRODUCTION'
  });
}
