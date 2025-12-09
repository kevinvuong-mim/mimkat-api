interface ApiResponse<T = any> {
  data?: T;
  path: string;
  message: string;
  success: boolean;
  timestamp: string;
  statusCode: number;
}

interface ErrorResponse {
  path: string;
  error: string;
  stack?: string; // Only in development
  success: false;
  message: string;
  timestamp: string;
  statusCode: number;
  errors?: ValidationError[];
}

interface PaginationMeta {
  page: number;
  total: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ValidationError {
  value?: any;
  field: string;
  message: string;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export type { ApiResponse, ErrorResponse, PaginationMeta, ValidationError, PaginatedResponse };
