/**
 * Code Compilation API Route
 *
 * Proxies compilation requests to the ink! Contract Checker Server.
 * Handles job submission, polling, and returns structured results.
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const CODE_CHECKER_URL =
  process.env.CODE_CHECKER_URL ||
  'https://monsters-code-validation-server-production.up.railway.app';
const CODE_CHECKER_API_KEY = process.env.CODE_CHECKER_API_KEY;
const MAX_POLL_ATTEMPTS = 60; // Max 60 attempts * 2s = 2 minutes
const POLL_INTERVAL = 2000; // 2 seconds

// Helper to build headers with optional API key
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (CODE_CHECKER_API_KEY) {
    headers['Authorization'] = `Bearer ${CODE_CHECKER_API_KEY}`;
  }
  return headers;
}

// Types matching the code validation server
interface CompilationError {
  level: 'error' | 'warning' | 'note' | 'help';
  code: string | null;
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
  } | null;
  snippet: string | null;
  suggestion: string | null;
  explanation: string | null;
}

interface CompilationResult {
  success: boolean;
  errors: CompilationError[];
  warnings: CompilationError[];
  stdout: string;
  stderr: string;
  duration: number;
}

interface JobResponse {
  jobId: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  progress: number;
  result: CompilationResult | null;
  error: string | null;
}

// =============================================================================
// POST /api/compile - Submit code for compilation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    // Submit job to code validation server
    const submitResponse = await fetch(`${CODE_CHECKER_URL}/api/v2/check`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));

      // Handle validation errors (blocked patterns, missing ink! contract, etc.)
      if (submitResponse.status === 400) {
        return NextResponse.json({
          success: false,
          validationError: true,
          message: errorData.message || 'Code validation failed',
          errors: [],
          warnings: [],
        });
      }

      return NextResponse.json(
        { error: errorData.message || 'Failed to submit compilation job' },
        { status: submitResponse.status }
      );
    }

    const { jobId } = await submitResponse.json();

    // Poll for completion
    const result = await pollForCompletion(jobId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Compile API] Error:', error);

    // Check if the code checker is unreachable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Code validation service unavailable',
          serviceUnavailable: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Polling Logic
// =============================================================================

async function pollForCompletion(jobId: string): Promise<{
  success: boolean;
  errors: CompilationError[];
  warnings: CompilationError[];
  duration?: number;
  message?: string;
}> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const statusResponse = await fetch(
      `${CODE_CHECKER_URL}/api/v2/check/${jobId}`,
      { headers: getHeaders() }
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to get job status: ${statusResponse.status}`);
    }

    const job: JobResponse = await statusResponse.json();

    if (job.status === 'completed' && job.result) {
      return {
        success: job.result.success,
        errors: job.result.errors,
        warnings: job.result.warnings,
        duration: job.result.duration,
      };
    }

    if (job.status === 'failed') {
      return {
        success: false,
        errors: [{
          level: 'error',
          code: null,
          message: job.error || 'Compilation failed',
          location: null,
          snippet: null,
          suggestion: null,
          explanation: null,
        }],
        warnings: [],
        message: job.error || 'Compilation failed',
      };
    }

    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    attempts++;
  }

  // Timeout
  return {
    success: false,
    errors: [{
      level: 'error',
      code: null,
      message: 'Compilation timed out. Please try again.',
      location: null,
      snippet: null,
      suggestion: null,
      explanation: null,
    }],
    warnings: [],
    message: 'Compilation timed out',
  };
}

// =============================================================================
// GET /api/compile/health - Check if code checker is available
// =============================================================================

export async function GET() {
  try {
    const response = await fetch(`${CODE_CHECKER_URL}/health`, {
      method: 'GET',
      headers: getHeaders(),
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return NextResponse.json({ available: true });
    }

    return NextResponse.json({ available: false });
  } catch {
    return NextResponse.json({ available: false });
  }
}
