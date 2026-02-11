import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  getSessionFromRequest: vi.fn(),
}));

// Mock global fetch for the external code validation server
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { POST, GET } from '../compile/route';
import { getSessionFromRequest } from '@/lib/auth-server';

const mockGetSession = vi.mocked(getSessionFromRequest);

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/compile', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/compile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const response = await POST(createPostRequest({ code: 'test' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain('Authentication required');
  });

  it('returns 400 when code is missing', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);

    const response = await POST(createPostRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Code is required');
  });

  it('returns 400 when code is not a string', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);

    const response = await POST(createPostRequest({ code: 123 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Code is required');
  });

  it('returns validation error for 400 from external service', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Missing ink! contract' }),
    });

    const response = await POST(createPostRequest({ code: 'invalid code' }));
    const body = await response.json();

    expect(response.status).toBe(200); // Returns 200 with validationError flag
    expect(body.validationError).toBe(true);
    expect(body.message).toContain('Missing ink! contract');
  });

  it('returns 503 when external service returns 5xx', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal error' }),
    });

    const response = await POST(createPostRequest({ code: 'valid code' }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.serviceUnavailable).toBe(true);
  });

  it('returns 503 on network error (service down)', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    const response = await POST(createPostRequest({ code: 'valid code' }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.serviceUnavailable).toBe(true);
  });

  it('submits code and polls for completion', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);

    // Submit response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-1' }),
    });

    // Poll response — completed immediately
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-1',
        status: 'completed',
        result: {
          success: true,
          errors: [],
          warnings: [],
          duration: 5000,
        },
      }),
    });

    const response = await POST(createPostRequest({ code: '#[ink::contract] ...' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.errors).toEqual([]);
    expect(body.duration).toBe(5000);
  });

  it('returns compilation errors from failed job', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: 'job-1' }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'job-1',
        status: 'failed',
        error: 'Compilation error: mismatched types',
      }),
    });

    const response = await POST(createPostRequest({ code: 'bad code' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].message).toContain('mismatched types');
  });
});

describe('GET /api/compile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns available: true when service is healthy', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const response = await GET();
    const body = await response.json();

    expect(body.available).toBe(true);
  });

  it('returns available: false when service is down', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const response = await GET();
    const body = await response.json();

    expect(body.available).toBe(false);
  });

  it('returns available: false when service returns error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const response = await GET();
    const body = await response.json();

    expect(body.available).toBe(false);
  });
});
