// Re-export homepage types
export * from "./homepage";

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ Theme Types ============
export interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  coverImage?: string | null;
  description?: string | null;
}

