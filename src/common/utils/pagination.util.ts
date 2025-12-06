import { PaginationMeta, PaginatedResponse } from '@/common/interfaces/response.interface';

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / perPage);

  const meta: PaginationMeta = {
    page,
    total,
    perPage,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };

  return {
    meta,
    items,
  };
}

export function getPaginationParams(
  page?: number,
  limit?: number,
): { page: number; limit: number; skip: number } {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 10));

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
}
