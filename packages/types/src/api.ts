export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
