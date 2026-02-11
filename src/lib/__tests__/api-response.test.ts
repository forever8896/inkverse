import { describe, it, expect, vi } from 'vitest';
import {
  successResponse,
  createdResponse,
  paginatedResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitedResponse,
  internalErrorResponse,
  isSuccessResponse,
  isErrorResponse,
} from '../api-response';

// Helper to extract JSON body and status from NextResponse
async function parseResponse(response: Response) {
  const body = await response.json();
  return { body, status: response.status };
}

// =============================================================================
// Success Responses
// =============================================================================

describe('successResponse', () => {
  it('returns 200 with success: true and data spread', async () => {
    const res = successResponse({ user: { id: 1, name: 'Alice' } });
    const { body, status } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user).toEqual({ id: 1, name: 'Alice' });
  });

  it('allows custom status code', async () => {
    const res = successResponse({ ok: true }, 202);
    const { status } = await parseResponse(res);
    expect(status).toBe(202);
  });

  it('spreads multiple data fields', async () => {
    const res = successResponse({ a: 1, b: 'two', c: [3] });
    const { body } = await parseResponse(res);
    expect(body.a).toBe(1);
    expect(body.b).toBe('two');
    expect(body.c).toEqual([3]);
  });
});

describe('createdResponse', () => {
  it('returns 201 with success: true', async () => {
    const res = createdResponse({ id: 42 });
    const { body, status } = await parseResponse(res);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.id).toBe(42);
  });
});

// =============================================================================
// Paginated Response
// =============================================================================

describe('paginatedResponse', () => {
  it('returns data array with pagination metadata', async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const res = paginatedResponse(items, { total: 50, page: 1, limit: 10 });
    const { body, status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(items);
    expect(body.pagination).toEqual({
      total: 50,
      page: 1,
      limit: 10,
      totalPages: 5,
    });
  });

  it('calculates totalPages correctly', async () => {
    const res = paginatedResponse([], { total: 25, page: 1, limit: 10 });
    const { body } = await parseResponse(res);
    expect(body.pagination.totalPages).toBe(3); // ceil(25/10) = 3
  });

  it('handles single page', async () => {
    const res = paginatedResponse([{ id: 1 }], { total: 1, page: 1, limit: 10 });
    const { body } = await parseResponse(res);
    expect(body.pagination.totalPages).toBe(1);
  });

  it('handles empty data', async () => {
    const res = paginatedResponse([], { total: 0, page: 1, limit: 10 });
    const { body } = await parseResponse(res);
    expect(body.data).toEqual([]);
    expect(body.pagination.totalPages).toBe(0);
  });
});

// =============================================================================
// Error Responses
// =============================================================================

describe('errorResponse', () => {
  it('returns 500 by default with success: false', async () => {
    const res = errorResponse('Something went wrong');
    const { body, status } = await parseResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Something went wrong');
  });

  it('uses custom status code', async () => {
    const res = errorResponse('Not found', 404);
    const { status } = await parseResponse(res);
    expect(status).toBe(404);
  });

  it('includes error code when provided', async () => {
    const res = errorResponse('Denied', 403, { code: 'FORBIDDEN' });
    const { body } = await parseResponse(res);
    expect(body.code).toBe('FORBIDDEN');
  });

  it('includes details when provided', async () => {
    const res = errorResponse('Bad', 400, { details: { field: 'email' } });
    const { body } = await parseResponse(res);
    expect(body.details).toEqual({ field: 'email' });
  });

  it('omits code and details when not provided', async () => {
    const res = errorResponse('Error');
    const { body } = await parseResponse(res);
    expect(body.code).toBeUndefined();
    expect(body.details).toBeUndefined();
  });
});

describe('badRequestResponse', () => {
  it('returns 400', async () => {
    const res = badRequestResponse('Invalid input');
    const { body, status } = await parseResponse(res);
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid input');
  });

  it('includes validation details', async () => {
    const res = badRequestResponse('Validation failed', { fields: ['email'] });
    const { body } = await parseResponse(res);
    expect(body.details).toEqual({ fields: ['email'] });
  });
});

describe('unauthorizedResponse', () => {
  it('returns 401 with default message', async () => {
    const res = unauthorizedResponse();
    const { body, status } = await parseResponse(res);
    expect(status).toBe(401);
    expect(body.error).toBe('Authentication required');
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('uses custom message', async () => {
    const res = unauthorizedResponse('Token expired');
    const { body } = await parseResponse(res);
    expect(body.error).toBe('Token expired');
  });
});

describe('forbiddenResponse', () => {
  it('returns 403 with default message', async () => {
    const res = forbiddenResponse();
    const { body, status } = await parseResponse(res);
    expect(status).toBe(403);
    expect(body.error).toBe('Access denied');
    expect(body.code).toBe('FORBIDDEN');
  });
});

describe('notFoundResponse', () => {
  it('returns 404 with resource name', async () => {
    const res = notFoundResponse('User');
    const { body, status } = await parseResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('User not found');
    expect(body.code).toBe('NOT_FOUND');
  });

  it('uses default resource name', async () => {
    const res = notFoundResponse();
    const { body } = await parseResponse(res);
    expect(body.error).toBe('Resource not found');
  });
});

describe('conflictResponse', () => {
  it('returns 409 with conflict message', async () => {
    const res = conflictResponse('Already exists');
    const { body, status } = await parseResponse(res);
    expect(status).toBe(409);
    expect(body.error).toBe('Already exists');
    expect(body.code).toBe('CONFLICT');
  });
});

describe('rateLimitedResponse', () => {
  it('returns 429 with default message', async () => {
    const res = rateLimitedResponse();
    const { body, status } = await parseResponse(res);
    expect(status).toBe(429);
    expect(body.error).toBe('Too many requests');
    expect(body.code).toBe('RATE_LIMITED');
  });

  it('sets Retry-After header when provided', async () => {
    const res = rateLimitedResponse('Slow down', 60);
    expect(res.headers.get('Retry-After')).toBe('60');
    const { body } = await parseResponse(res);
    expect(body.details).toEqual({ retryAfter: 60 });
  });

  it('omits Retry-After header when not provided', async () => {
    const res = rateLimitedResponse('Slow down');
    expect(res.headers.get('Retry-After')).toBeNull();
  });
});

describe('internalErrorResponse', () => {
  it('returns 500 with generic message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = internalErrorResponse(new Error('DB crash'));
    const { body, status } = await parseResponse(res);

    expect(status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(body.code).toBe('INTERNAL_ERROR');
    // Should NOT expose internal error message
    expect(JSON.stringify(body)).not.toContain('DB crash');
    consoleSpy.mockRestore();
  });

  it('logs the actual error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('secret info');
    internalErrorResponse(err);
    expect(consoleSpy).toHaveBeenCalledWith('[API Error]', err);
    consoleSpy.mockRestore();
  });

  it('uses custom public message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = internalErrorResponse(new Error('x'), 'Service unavailable');
    const { body } = await parseResponse(res);
    expect(body.error).toBe('Service unavailable');
    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Type Guards
// =============================================================================

describe('isSuccessResponse', () => {
  it('returns true for success responses', () => {
    expect(isSuccessResponse({ success: true })).toBe(true);
  });

  it('returns false for error responses', () => {
    expect(isSuccessResponse({ success: false, error: 'fail' })).toBe(false);
  });
});

describe('isErrorResponse', () => {
  it('returns true for error responses', () => {
    expect(isErrorResponse({ success: false, error: 'fail' })).toBe(true);
  });

  it('returns false for success responses', () => {
    expect(isErrorResponse({ success: true })).toBe(false);
  });
});
