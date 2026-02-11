# Testing Guide

Comprehensive testing documentation for Monsters Ink! Covers how to run tests, add new tests, and the testing strategy.

---

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test -- src/lib/__tests__/validation.test.ts

# Run tests matching a pattern
npm test -- --grep "parseIntSafe"

# Open interactive test UI
npm test -- --ui
```

---

## Test Suite Overview

| Category | Files | Tests | What's Tested |
|----------|-------|-------|---------------|
| **Unit Tests** | 8 | 212 | Pure logic: validation, status guards, API responses, prompt generation, error classification, logging, image filters, lesson schema validation |
| **Integration Tests** | 6 | 53 | API routes with mocked DB/services: health, lessons, progress, compile, generate-monster, gallery |
| **State Machine Tests** | 1 | 39 | Generation job error handlers, retry logic, timing |
| **Total** | **15** | **304** | |

All tests run in ~1.3 seconds.

---

## Test Architecture

### Framework & Tools

- **Vitest** — Test runner and assertion library
- **jsdom** — Browser environment for DOM-dependent tests
- **@vitest/coverage-v8** — Code coverage via V8's built-in coverage
- **vi.mock()** — Module mocking for isolating dependencies

### Directory Structure

```
src/
├── lib/__tests__/                    # Unit tests for lib/ modules
│   ├── validation.test.ts            # Code validation patterns
│   ├── status-constants.test.ts      # Job status type guards
│   ├── api-response.test.ts          # API response builders
│   ├── monster-prompts.test.ts       # AI prompt generation
│   ├── lesson-editor-validation.test.ts  # Zod schema validation
│   ├── pipeline-errors.test.ts       # Error classification + backoff
│   ├── image-filters.test.ts         # CSS filter generation
│   ├── logger.test.ts                # Structured logging
│   └── generation-job.state-machine.test.ts  # Job state machine
├── app/api/__tests__/                # Integration tests for API routes
│   ├── health.test.ts                # GET /api/health
│   ├── lessons.test.ts               # GET /api/lessons/list, /api/lessons/[id]
│   ├── progress.test.ts              # GET/POST /api/progress, /api/progress/step
│   ├── compile.test.ts               # POST /api/compile, GET /api/compile
│   ├── generate-monster.test.ts      # POST/GET /api/generate-monster
│   └── gallery.test.ts               # GET /api/gallery/monsters
└── test/
    └── setup.ts                      # Global test setup
```

### Configuration

Test configuration lives in `vitest.config.ts`:

- **Environment:** jsdom (provides `window`, `document`, `localStorage`)
- **Globals:** `describe`, `it`, `expect` available without imports
- **Path aliases:** `@/` maps to `src/`
- **Coverage:** V8 provider, reports in `./coverage/`

---

## Writing Tests

### Unit Tests (Pure Logic)

For files with no external dependencies — the easiest to write and most reliable:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('handles the happy path', () => {
    expect(myFunction('valid input')).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myFunction(null)).toBeNull();
    expect(myFunction('')).toBe('default');
  });
});
```

**Best candidates for unit tests:**
- Validation functions
- Type guards and status checks
- Pure data transformations
- Configuration constants (completeness checks)

### Integration Tests (API Routes)

For Next.js API route handlers — mock external dependencies, test HTTP behavior:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies BEFORE importing the route
vi.mock('@/lib/postgres', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth-server', () => ({
  getSessionFromRequest: vi.fn(),
}));

import { GET, POST } from '../my-route/route';
import { query } from '@/lib/postgres';
import { getSessionFromRequest } from '@/lib/auth-server';

const mockQuery = vi.mocked(query);
const mockGetSession = vi.mocked(getSessionFromRequest);

describe('POST /api/my-route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns data on success', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'u1' } } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

    const request = new NextRequest('http://localhost/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
```

**Key patterns:**
- Mock modules with `vi.mock()` **before** importing the route handler
- Use `vi.clearAllMocks()` in `beforeEach` to prevent test pollution
- Test authentication, validation, happy path, and error handling
- Use `vi.mocked()` for type-safe mock access
- Parse response with `await response.json()` and check both status and body

### Testing External Services

For routes that call external APIs (compile, generate-monster):

```typescript
// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

it('handles external service failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 503,
    json: async () => ({ message: 'Service down' }),
  });

  const response = await POST(request);
  expect(response.status).toBe(503);
});
```

---

## Code Coverage

Run coverage with:

```bash
npm run test:coverage
```

This generates:
- **Terminal output** — summary table with per-file coverage
- **HTML report** — `coverage/index.html` (open in browser for detailed line-by-line view)
- **LCOV report** — `coverage/lcov.info` (for CI integration)

### Coverage Scope

Coverage is measured for:
- `src/lib/**/*.ts` — Shared utilities and business logic
- `src/app/api/**/*.ts` — API route handlers
- `src/services/**/*.ts` — External service integrations

### Current Coverage Highlights

Files with 100% coverage:
- `api-response.ts` — API response builders
- `status-constants.ts` — Job status type guards
- `monster-prompts.ts` — AI prompt generation
- `pipeline-errors.ts` — Error classification and backoff

---

## Testing Patterns

### What to Test

| Layer | What to Test | How |
|-------|-------------|-----|
| **Pure functions** | Input/output, edge cases, error handling | Direct function calls |
| **API routes** | Auth, validation, happy path, errors, status codes | Import handler, mock deps |
| **Type guards** | True/false for all categories, null/undefined | Direct calls with all values |
| **Constants** | Completeness, consistency between arrays | Iterate and assert |
| **Error handling** | Classification, retry decisions, backoff timing | Mock error objects |

### What NOT to Test

- **React components** — jsdom doesn't render Next.js server components properly; use Playwright for E2E if needed
- **Database queries directly** — mock the `query()` function, test the route logic
- **External API calls** — mock `fetch`, test error handling and response mapping
- **AI generation** — costs ~$0.70 per call; mock the services

### Common Patterns

**Testing async functions:**
```typescript
it('handles async errors', async () => {
  mockQuery.mockRejectedValueOnce(new Error('DB down'));
  const response = await GET(request);
  expect(response.status).toBe(500);
});
```

**Testing with fake timers:**
```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

it('calculates delay correctly', () => {
  vi.setSystemTime(new Date('2026-01-01'));
  // test time-dependent logic
});
```

**Testing localStorage:**
```typescript
beforeEach(() => { localStorage.clear(); });

it('saves and loads values', () => {
  saveToStorage({ key: 'value' });
  expect(loadFromStorage()).toEqual({ key: 'value' });
});
```

---

## Adding Tests for New Features

1. **New utility function** → Add tests in `src/lib/__tests__/<module>.test.ts`
2. **New API route** → Add tests in `src/app/api/__tests__/<route>.test.ts`
3. **New validation rules** → Add test cases to `validation.test.ts`
4. **New lesson content** → Validate with `lesson-editor-validation.test.ts` patterns

### Checklist for New Tests

- [ ] Tests cover the happy path
- [ ] Tests cover error/edge cases
- [ ] Tests cover authentication (if applicable)
- [ ] Tests cover validation (if applicable)
- [ ] Mocks are cleaned up with `vi.clearAllMocks()` in `beforeEach`
- [ ] Tests run independently (no shared state between tests)
- [ ] Tests are fast (mock external dependencies, don't hit real services)
