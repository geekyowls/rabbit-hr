export interface UserBasic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}
