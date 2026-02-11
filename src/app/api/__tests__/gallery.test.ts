import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/postgres', () => ({
  query: vi.fn(),
}));

vi.mock('@/services/s3-service', () => ({
  S3Service: {
    getInstance: () => ({
      getPresignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
    }),
  },
}));

import { GET } from '../gallery/monsters/route';
import { query } from '@/lib/postgres';

const mockQuery = vi.mocked(query);

function createRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/gallery/monsters');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/gallery/monsters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns monsters with presigned URLs', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'monster-1',
            image_s3_key: 'images/monster-1.png',
            glb_s3_key: 'models/monster-1.glb',
            stage: 'adult',
            owner_address: '5GrwvaEF...',
            created_at: new Date('2026-01-01'),
          },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
        rowCount: 1,
      });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.monsters).toHaveLength(1);
    expect(body.monsters[0].id).toBe('monster-1');
    expect(body.monsters[0].imageUrl).toBe('https://s3.example.com/presigned-url');
    expect(body.monsters[0].stage).toBe('adult');
    expect(body.total).toBe(1);
  });

  it('returns empty array when no monsters exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.monsters).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.hasMore).toBe(false);
  });

  it('respects limit parameter', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    await GET(createRequest({ limit: '5' }));

    // First call is the monsters query — check limit param
    const [, params] = mockQuery.mock.calls[0];
    expect(params![0]).toBe(5);
  });

  it('caps limit at 50', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    await GET(createRequest({ limit: '100' }));

    const [, params] = mockQuery.mock.calls[0];
    expect(params![0]).toBe(50);
  });

  it('defaults limit to 20', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    await GET(createRequest());

    const [, params] = mockQuery.mock.calls[0];
    expect(params![0]).toBe(20);
  });

  it('respects offset parameter', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 });

    await GET(createRequest({ offset: '10' }));

    const [, params] = mockQuery.mock.calls[0];
    expect(params![1]).toBe(10);
  });

  it('calculates hasMore correctly', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { id: 'm1', image_s3_key: 'img.png', glb_s3_key: null, stage: 'young', owner_address: '5G...', created_at: new Date() },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 });

    const response = await GET(createRequest({ limit: '1', offset: '0' }));
    const body = await response.json();

    expect(body.hasMore).toBe(true);
  });

  it('maps young stage correctly', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { id: 'm1', image_s3_key: 'img.png', glb_s3_key: null, stage: 'young', owner_address: '5G...', created_at: new Date() },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.monsters[0].stage).toBe('young');
  });

  it('maps young_3d stage when model exists', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { id: 'm1', image_s3_key: 'img.png', glb_s3_key: 'model.glb', stage: 'young', owner_address: '5G...', created_at: new Date() },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.monsters[0].stage).toBe('young_3d');
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
