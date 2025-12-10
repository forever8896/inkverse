/**
 * Standardized API Response Helpers
 *
 * Provides consistent response shapes across all API routes.
 * All successful responses include `success: true` and data fields.
 * All error responses include `success: false` and an `error` field.
 *
 * @example Success response:
 * ```typescript
 * return successResponse({ user: { id: 1, name: "Alice" } });
 * // { success: true, user: { id: 1, name: "Alice" } }
 * ```
 *
 * @example Error response:
 * ```typescript
 * return errorResponse("User not found", 404);
 * // { success: false, error: "User not found" }
 * ```
 *
 * @example Paginated response:
 * ```typescript
 * return paginatedResponse(jobs, { total: 100, page: 1, limit: 10 });
 * // { success: true, data: [...], pagination: { total, page, limit, totalPages } }
 * ```
 */

import { NextResponse } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Success Responses
// ============================================================================

/**
 * Create a successful API response.
 *
 * The data object is spread into the response, so you can structure it
 * however makes sense for your endpoint.
 *
 * @param data - Object containing response data (spread into response)
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success: true and data fields
 *
 * @example
 * ```typescript
 * // Single resource
 * return successResponse({ lesson: lessonData });
 *
 * // Multiple fields
 * return successResponse({ user: userData, settings: userSettings });
 *
 * // With custom status
 * return successResponse({ id: newId }, 201);
 * ```
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true as const, ...data },
    { status }
  );
}

/**
 * Create a successful response for resource creation (201).
 *
 * @param data - Object containing created resource data
 * @returns NextResponse with status 201
 */
export function createdResponse<T extends Record<string, unknown>>(
  data: T
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201);
}

/**
 * Create a paginated API response.
 *
 * Standardizes pagination metadata across all list endpoints.
 *
 * @param data - Array of items for current page
 * @param options - Pagination options (total, page, limit)
 * @returns NextResponse with data array and pagination metadata
 *
 * @example
 * ```typescript
 * const jobs = await getJobs({ page: 2, limit: 20 });
 * const total = await countJobs();
 * return paginatedResponse(jobs, { total, page: 2, limit: 20 });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  options: { total: number; page: number; limit: number }
): NextResponse<PaginatedApiResponse<T>> {
  const { total, page, limit } = options;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true as const,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
}

// ============================================================================
// Error Responses
// ============================================================================

/**
 * Create an error API response.
 *
 * @param error - Error message to display
 * @param status - HTTP status code (default: 500)
 * @param options - Additional error context
 * @returns NextResponse with success: false and error details
 *
 * @example
 * ```typescript
 * // Basic error
 * return errorResponse("Something went wrong");
 *
 * // Not found
 * return errorResponse("User not found", 404);
 *
 * // With error code
 * return errorResponse("Rate limit exceeded", 429, { code: "RATE_LIMITED" });
 * ```
 */
export function errorResponse(
  error: string,
  status: number = 500,
  options?: { code?: string; details?: unknown }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (options?.code) {
    response.code = options.code;
  }

  if (options?.details !== undefined) {
    response.details = options.details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a 400 Bad Request error response.
 *
 * @param error - Validation error message
 * @param details - Optional validation details
 */
export function badRequestResponse(
  error: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400, { details });
}

/**
 * Create a 401 Unauthorized error response.
 *
 * @param error - Auth error message (default: "Authentication required")
 */
export function unauthorizedResponse(
  error: string = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401, { code: 'UNAUTHORIZED' });
}

/**
 * Create a 403 Forbidden error response.
 *
 * @param error - Permission error message (default: "Access denied")
 */
export function forbiddenResponse(
  error: string = 'Access denied'
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403, { code: 'FORBIDDEN' });
}

/**
 * Create a 404 Not Found error response.
 *
 * @param resource - Name of resource that wasn't found
 */
export function notFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, 404, { code: 'NOT_FOUND' });
}

/**
 * Create a 409 Conflict error response.
 *
 * @param error - Conflict description
 */
export function conflictResponse(
  error: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 409, { code: 'CONFLICT' });
}

/**
 * Create a 429 Rate Limited error response.
 *
 * @param error - Rate limit message
 * @param retryAfter - Seconds until retry is allowed
 */
export function rateLimitedResponse(
  error: string = 'Too many requests',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = errorResponse(error, 429, {
    code: 'RATE_LIMITED',
    details: retryAfter ? { retryAfter } : undefined,
  });

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Create a 500 Internal Server Error response.
 *
 * Logs the error internally but returns a generic message to clients.
 *
 * @param error - Internal error (logged, not exposed)
 * @param publicMessage - Message shown to client
 */
export function internalErrorResponse(
  error: unknown,
  publicMessage: string = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  // Log the actual error for debugging
  console.error('[API Error]', error);

  return errorResponse(publicMessage, 500, { code: 'INTERNAL_ERROR' });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Type guard to check if a response indicates success.
 *
 * @param response - API response object
 * @returns true if response has success: true
 */
export function isSuccessResponse<T>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response indicates an error.
 *
 * @param response - API response object
 * @returns true if response has success: false
 */
export function isErrorResponse(
  response: ApiSuccessResponse | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}
