import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({
  query: vi.fn(),
}));

vi.mock('@/types/errors', () => ({
  logError: vi.fn(),
}));

import { GET as progressGET } from '../progress/route';
import { GET as stepGET, POST as stepPOST } from '../progress/step/route';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';

const mockGetSession = vi.mocked(getSessionFromRequest);
const mockQuery = vi.mocked(query);

const authenticatedSession = {
  user: { id: 'user-1', email: 'test@test.com' },
  session: { id: 'sess-1' },
} as any;

describe('GET /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/progress');
    const response = await progressGET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain('Authentication required');
  });

  it('returns lesson and chapter progress for authenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    // Lesson progress query
    mockQuery.mockResolvedValueOnce({
      rows: [{ lesson_id: 1, started_at: '2026-01-01', completed_at: null, current_chapter_id: 1, evolution_stage: 'egg' }],
      rowCount: 1,
    });

    // Chapter progress query
    mockQuery.mockResolvedValueOnce({
      rows: [{ lesson_id: 1, chapter_id: 1, started_at: '2026-01-01', completed_at: null, current_step_id: 2 }],
      rowCount: 1,
    });

    // Current position query
    mockQuery.mockResolvedValueOnce({
      rows: [{ lesson_id: 1, chapter_id: 1, step_id: 3 }],
      rowCount: 1,
    });

    const request = new NextRequest('http://localhost/api/progress');
    const response = await progressGET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.lessonProgress).toHaveLength(1);
    expect(body.chapterProgress).toHaveLength(1);
    expect(body.currentPosition).toEqual({ lesson_id: 1, chapter_id: 1, step_id: 3 });
  });

  it('returns null currentPosition when no incomplete steps', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const request = new NextRequest('http://localhost/api/progress');
    const response = await progressGET(request);
    const body = await response.json();

    expect(body.currentPosition).toBeNull();
  });

  it('returns 500 on database error', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/progress');
    const response = await progressGET(request);

    expect(response.status).toBe(500);
  });
});

describe('GET /api/progress/step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/progress/step?lessonId=1&chapterId=1&stepId=1');
    const response = await stepGET(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 for missing query params', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    const request = new NextRequest('http://localhost/api/progress/step');
    const response = await stepGET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Missing');
  });

  it('returns step progress for valid params', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1', lesson_id: 1, chapter_id: 1, step_id: 1, completed_at: '2026-01-01' }],
      rowCount: 1,
    });

    const request = new NextRequest('http://localhost/api/progress/step?lessonId=1&chapterId=1&stepId=1');
    const response = await stepGET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.progress).toBeDefined();
    expect(body.progress.completed_at).toBe('2026-01-01');
  });

  it('returns null progress for unvisited step', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const request = new NextRequest('http://localhost/api/progress/step?lessonId=1&chapterId=1&stepId=99');
    const response = await stepGET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.progress).toBeNull();
  });
});

describe('POST /api/progress/step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/progress/step', {
      method: 'POST',
      body: JSON.stringify({ lessonId: 1, chapterId: 1, stepId: 1 }),
    });
    const response = await stepPOST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    const request = new NextRequest('http://localhost/api/progress/step', {
      method: 'POST',
      body: JSON.stringify({ lessonId: 1 }),
    });
    const response = await stepPOST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Missing required fields');
  });

  it('returns 400 for non-existent lesson', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    const request = new NextRequest('http://localhost/api/progress/step', {
      method: 'POST',
      body: JSON.stringify({ lessonId: 9999, chapterId: 1, stepId: 1 }),
    });
    const response = await stepPOST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('does not exist');
  });

  it('saves step progress for valid data', async () => {
    mockGetSession.mockResolvedValueOnce(authenticatedSession);

    // Step upsert query
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1', lesson_id: 1, chapter_id: 1, step_id: 1, completed_at: null }],
      rowCount: 1,
    });

    const request = new NextRequest('http://localhost/api/progress/step', {
      method: 'POST',
      body: JSON.stringify({
        lessonId: 1,
        chapterId: 1,
        stepId: 1,
        completed: false,
      }),
    });
    const response = await stepPOST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.progress).toBeDefined();
  });
});
