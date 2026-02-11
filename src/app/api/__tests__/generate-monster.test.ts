import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all external dependencies
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/admin-auth', () => ({
  isSessionAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/generation-job', () => ({
  GenerationJob: {
    findByUserId: vi.fn().mockResolvedValue([]),
    countCompletedSets: vi.fn().mockResolvedValue({ young: 0, adult: 0 }),
    findActive: vi.fn().mockResolvedValue(null),
    createWithTrigger: vi.fn().mockResolvedValue({
      id: 'job-123',
      workflowRunId: null,
      status: 'pending',
      update: vi.fn(),
    }),
  },
}));

vi.mock('@/lib/user-monster', () => ({
  UserMonster: {
    getOrCreate: vi.fn().mockResolvedValue({ id: 'monster-123' }),
  },
}));

vi.mock('@/services/nfts-pallet-service', () => ({
  NFTsPalletService: {
    validateSS58Address: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('workflow/api', () => ({
  start: vi.fn().mockResolvedValue({ runId: 'run-abc' }),
}));

vi.mock('@/workflows/generate-monster', () => ({
  generateMonster: 'mock-workflow',
}));

import { POST, GET } from '../generate-monster/route';
import { auth } from '@/lib/auth';

const mockGetSession = vi.mocked(auth.api.getSession);

function validMonsterBody() {
  return {
    eyes: 2,
    bodyType: 'fluffy',
    size: 'medium',
    attitude: 'wise',
    canFly: 'wings',
    specialPower: 'fire',
    magicalAura: 'sparkly',
    colorScheme: 'purple',
    texture: 'fur',
    habitat: 'forest',
    stage: 'young',
    walletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  };
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/generate-monster', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/generate-monster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const response = await POST(createPostRequest(validMonsterBody()));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication required');
    });

    it('returns 401 when session has no user', async () => {
      mockGetSession.mockResolvedValueOnce({ user: null } as any);

      const response = await POST(createPostRequest(validMonsterBody()));
      expect(response.status).toBe(401);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        session: { id: 'sess-1' },
      } as any);
    });

    it('returns 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/generate-monster', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid JSON');
    });

    it('returns 400 when wallet address is missing', async () => {
      const monster = validMonsterBody();
      delete (monster as any).walletAddress;

      const response = await POST(createPostRequest(monster));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('WALLET_REQUIRED');
    });

    it('returns 400 for invalid eyes value', async () => {
      const response = await POST(createPostRequest({
        ...validMonsterBody(),
        eyes: 5,
      }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('eyes');
    });

    it('returns 400 for invalid bodyType', async () => {
      const response = await POST(createPostRequest({
        ...validMonsterBody(),
        bodyType: 'squishy',
      }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('bodyType');
    });

    it('returns 400 for invalid stage', async () => {
      const response = await POST(createPostRequest({
        ...validMonsterBody(),
        stage: 'mega',
      }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('stage');
    });

    it('returns 400 with multiple validation errors', async () => {
      const response = await POST(createPostRequest({
        ...validMonsterBody(),
        eyes: 99,
        bodyType: 'invalid',
        size: 'invalid',
      }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('eyes');
      expect(body.error).toContain('bodyType');
      expect(body.error).toContain('size');
    });

    it('accepts valid monster data and creates job', async () => {
      const response = await POST(createPostRequest(validMonsterBody()));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.jobId).toBe('job-123');
      expect(body.runId).toBe('run-abc');
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        session: { id: 'sess-1' },
      } as any);
    });

    it('returns 429 when user has too many active jobs', async () => {
      const { GenerationJob } = await import('@/lib/generation-job');
      vi.mocked(GenerationJob.findByUserId).mockResolvedValueOnce([
        { status: 'pending' },
        { status: 'generating_image' },
      ] as any);

      const response = await POST(createPostRequest(validMonsterBody()));
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error).toContain('active jobs');
    });
  });
});

describe('GET /api/generate-monster', () => {
  it('returns API documentation', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.endpoint).toBe('POST /api/generate-monster');
    expect(body.parameters).toBeDefined();
    expect(body.authentication).toContain('Required');
  });
});
