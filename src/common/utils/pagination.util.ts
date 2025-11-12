import {
  PaginatedResponse,
  PaginationMeta,
} from '@common/interfaces/response.interface';

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / perPage);

  const meta: PaginationMeta = {
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    items,
    meta,
  };
}

export function getPaginationParams(
  page?: number,
  limit?: number,
): { page: number; limit: number; skip: number } {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 10));
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
  };
}
