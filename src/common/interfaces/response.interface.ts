export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationError[];
  timestamp: string;
  path: string;
  stack?: string; // Only in development
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
