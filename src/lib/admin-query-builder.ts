/**
 * Admin Query Builder Utilities
 *
 * Provides consistent pagination, search, and sort handling for admin API routes.
 * Reduces code duplication and ensures consistent query patterns across endpoints.
 *
 * @example
 * ```typescript
 * const params = extractPaginationParams(searchParams, { defaultLimit: 25 });
 * const search = buildSearchCondition(['name', 'email'], params.search, params.queryParams);
 * const sort = buildSortClause(params.sortBy, params.sortOrder, ALLOWED_SORT_FIELDS);
 *
 * const countQuery = `SELECT COUNT(*) FROM users ${search.clause}`;
 * const dataQuery = `SELECT * FROM users ${search.clause} ${sort} LIMIT $${search.nextParam} OFFSET $${search.nextParam + 1}`;
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string | null;
  /** Accumulator for query parameters */
  queryParams: unknown[];
}

export interface PaginationOptions {
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  maxLimit?: number;
}

export interface SearchConditionResult {
  /** SQL WHERE clause fragment (includes WHERE keyword if conditions exist) */
  clause: string;
  /** Index for next parameter placeholder */
  nextParam: number;
}

export interface WhereCondition {
  /** SQL condition string with $N placeholders */
  condition: string;
  /** Parameter value(s) for this condition */
  params: unknown[];
}

export interface SortFieldMapping {
  /** SQL column reference (e.g., 'u."createdAt"', 'mg.status') */
  column: string;
  /** Optional secondary sort field */
  secondary?: string;
  /** Handle NULLS LAST for nullable fields */
  nullsLast?: boolean;
}

// ============================================================================
// Pagination Parameter Extraction
// ============================================================================

/**
 * Extract and validate pagination parameters from URL search params.
 *
 * @param searchParams - URL search parameters
 * @param options - Default values and constraints
 * @returns Parsed pagination parameters with initialized queryParams array
 *
 * @example
 * ```typescript
 * const params = extractPaginationParams(request.nextUrl.searchParams, {
 *   defaultLimit: 20,
 *   defaultSortBy: 'createdAt',
 *   maxLimit: 100
 * });
 * // params.page = 1, params.limit = 20, params.offset = 0, etc.
 * ```
 */
export function extractPaginationParams(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): PaginationParams {
  const {
    defaultLimit = 20,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    maxLimit = 100,
  } = options;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const offset = (page - 1) * limit;

  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrderParam = searchParams.get('sortOrder')?.toLowerCase();
  const sortOrder: 'asc' | 'desc' =
    sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : defaultSortOrder;

  const search = searchParams.get('search')?.trim() || null;

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    search,
    queryParams: [],
  };
}

// ============================================================================
// Search Condition Building
// ============================================================================

/**
 * Build a search WHERE condition for ILIKE text search across multiple fields.
 *
 * @param fields - Array of SQL column references to search
 * @param searchTerm - Search term (will be wrapped in %)
 * @param queryParams - Accumulator array for query parameters (will be mutated)
 * @returns WHERE clause fragment and next parameter index
 *
 * @example
 * ```typescript
 * const params: unknown[] = [];
 * const search = buildSearchCondition(
 *   ['u.name', 'u.email', 'u.id::text'],
 *   'john',
 *   params
 * );
 * // search.clause = 'WHERE (u.name ILIKE $1 OR u.email ILIKE $1 OR u.id::text ILIKE $1)'
 * // params = ['%john%']
 * // search.nextParam = 2
 * ```
 */
export function buildSearchCondition(
  fields: string[],
  searchTerm: string | null,
  queryParams: unknown[]
): SearchConditionResult {
  if (!searchTerm || fields.length === 0) {
    return { clause: '', nextParam: queryParams.length + 1 };
  }

  const paramIndex = queryParams.length + 1;
  const conditions = fields.map((field) => `${field} ILIKE $${paramIndex}`).join(' OR ');

  queryParams.push(`%${searchTerm}%`);

  return {
    clause: `WHERE (${conditions})`,
    nextParam: queryParams.length + 1,
  };
}

/**
 * Build WHERE clause from multiple conditions.
 *
 * @param conditions - Array of condition objects
 * @param queryParams - Accumulator array for query parameters (will be mutated)
 * @returns WHERE clause fragment and next parameter index
 *
 * @example
 * ```typescript
 * const params: unknown[] = [];
 * const where = buildWhereClause([
 *   { condition: 'status = $1', params: ['active'] },
 *   { condition: 'created_at > $2', params: [someDate] },
 * ], params);
 * // where.clause = 'WHERE status = $1 AND created_at > $2'
 * // params = ['active', someDate]
 * ```
 */
export function buildWhereClause(
  conditions: WhereCondition[],
  queryParams: unknown[]
): SearchConditionResult {
  if (conditions.length === 0) {
    return { clause: '', nextParam: queryParams.length + 1 };
  }

  const clauseParts: string[] = [];

  for (const { condition, params } of conditions) {
    // Replace placeholder indices with actual indices
    let adjustedCondition = condition;
    params.forEach((param, i) => {
      const newIndex = queryParams.length + 1;
      // Replace $N with actual index (assuming conditions use $1, $2, etc. relatively)
      adjustedCondition = adjustedCondition.replace(`$${i + 1}`, `$${newIndex}`);
      queryParams.push(param);
    });
    clauseParts.push(adjustedCondition);
  }

  return {
    clause: `WHERE ${clauseParts.join(' AND ')}`,
    nextParam: queryParams.length + 1,
  };
}

/**
 * Add a search condition to existing conditions array.
 *
 * @param conditions - Mutable array of WHERE conditions
 * @param fields - Fields to search
 * @param searchTerm - Search term
 */
export function addSearchCondition(
  conditions: WhereCondition[],
  fields: string[],
  searchTerm: string | null
): void {
  if (!searchTerm || fields.length === 0) return;

  const searchConditions = fields.map((f) => `${f} ILIKE $1`).join(' OR ');
  conditions.push({
    condition: `(${searchConditions})`,
    params: [`%${searchTerm}%`],
  });
}

/**
 * Add an equality filter condition.
 *
 * @param conditions - Mutable array of WHERE conditions
 * @param column - Column to filter
 * @param value - Value to match (condition skipped if null/undefined)
 */
export function addFilterCondition(
  conditions: WhereCondition[],
  column: string,
  value: unknown
): void {
  if (value === null || value === undefined) return;

  conditions.push({
    condition: `${column} = $1`,
    params: [value],
  });
}

// ============================================================================
// Sort Clause Building
// ============================================================================

/**
 * Build ORDER BY clause with validation against allowed fields.
 *
 * @param sortBy - Requested sort field
 * @param sortOrder - Sort direction ('asc' or 'desc')
 * @param allowedFields - Mapping of allowed field names to SQL columns
 * @param defaultField - Fallback field if sortBy is not allowed
 * @returns SQL ORDER BY clause
 *
 * @example
 * ```typescript
 * const SORT_FIELDS: Record<string, SortFieldMapping> = {
 *   createdAt: { column: 'u."createdAt"' },
 *   jobCount: { column: 'job_count', secondary: 'u."createdAt" DESC' },
 *   lastActive: { column: 'last_active', secondary: 'u."createdAt" DESC', nullsLast: true },
 * };
 *
 * const orderBy = buildSortClause('jobCount', 'desc', SORT_FIELDS, 'createdAt');
 * // 'ORDER BY job_count DESC, u."createdAt" DESC'
 * ```
 */
export function buildSortClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  allowedFields: Record<string, SortFieldMapping>,
  defaultField: string = 'createdAt'
): string {
  const direction = sortOrder.toUpperCase();
  const fieldMapping = allowedFields[sortBy] || allowedFields[defaultField];

  if (!fieldMapping) {
    // Ultimate fallback - should not happen if defaultField is in allowedFields
    return '';
  }

  let clause = `ORDER BY ${fieldMapping.column} ${direction}`;

  if (fieldMapping.nullsLast) {
    clause += ' NULLS LAST';
  }

  if (fieldMapping.secondary) {
    clause += `, ${fieldMapping.secondary}`;
  }

  return clause;
}

// ============================================================================
// Query Execution Helpers
// ============================================================================

/**
 * Build LIMIT and OFFSET clause and add parameters.
 *
 * @param params - Pagination parameters
 * @param queryParams - Accumulator array for query parameters (will be mutated)
 * @returns LIMIT/OFFSET clause string
 *
 * @example
 * ```typescript
 * const clause = buildLimitOffsetClause(params, queryParams);
 * // 'LIMIT $3 OFFSET $4' (indices depend on existing params)
 * ```
 */
export function buildLimitOffsetClause(
  params: Pick<PaginationParams, 'limit' | 'offset'>,
  queryParams: unknown[]
): string {
  const limitIndex = queryParams.length + 1;
  const offsetIndex = queryParams.length + 2;

  queryParams.push(params.limit);
  queryParams.push(params.offset);

  return `LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
}

/**
 * Calculate pagination metadata from total count.
 *
 * @param total - Total number of records
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): { total: number; page: number; limit: number; totalPages: number } {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
