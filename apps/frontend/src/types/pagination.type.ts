export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    lastPage: number;
  };
}
