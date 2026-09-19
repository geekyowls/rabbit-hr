export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  payload?: T;
  metadata?: PaginationMetadata;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  payload: T[];
  metadata: PaginationMetadata;
}
