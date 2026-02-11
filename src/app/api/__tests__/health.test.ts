import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock postgres before importing the route
vi.mock('@/lib/postgres', () => ({
  query: vi.fn(),
}));

import { GET } from '../health/route';
import { query } from '@/lib/postgres';

const mockQuery = vi.mocked(query);

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when database is reachable', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database).toBe('healthy');
    expect(body.services.application).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('returns unhealthy status when database is unreachable', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.services.database).toBe('unhealthy');
    expect(body.services.application).toBe('healthy');
  });

  it('calls SELECT 1 to check database', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await GET();

    expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
  });

  it('always includes a timestamp', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await GET();
    const body = await response.json();

    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
