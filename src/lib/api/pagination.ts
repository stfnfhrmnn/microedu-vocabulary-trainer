/**
 * Pagination utilities for API routes
 */

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const pageParam = url.searchParams.get('page')
  const limitParam = url.searchParams.get('limit')

  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Create a paginated response
 */
export function paginateArray<T>(
  items: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const { page, limit, offset } = params
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const paginatedItems = items.slice(offset, offset + limit)

  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}
