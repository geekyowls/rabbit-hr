import type { PaginationMetadata } from '../types';

/**
 * Create pagination metadata for paginated responses
 * @param page - Current page number (1-indexed, i.e., first page is 1)
 * @param limit - Number of items per page
 * @param total - Total number of items
 * @returns Complete pagination metadata object
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number,
): PaginationMetadata {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calculate skip value for database queries
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Number of items to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * @deprecated Use createPaginationMetadata instead
 */
export function calculatePaginationMetadata(page: number, limit: number, total: number) {
  return createPaginationMetadata(page, limit, total);
}
