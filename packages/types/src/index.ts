export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShopAccount {
  id: number;
  serialNumber: string;
  images: string[];
  price: number;
  title: string;
  description: string;
  xianyuUrl: string;
  email: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopAccountListResult {
  list: ShopAccount[];
  pagination: Pagination;
  keyword?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
  };
}

export interface CarouselItem {
  sortOrder: number;
  url: string;
  linkUrl?: string;
}

export interface Carousel {
  id: number;
  name: string;
  items: CarouselItem[];
  createdAt?: string;
  updatedAt?: string;
}

export type AdminAccount = ShopAccount;

export interface AdminAccountListResult {
  list: AdminAccount[];
  pagination: Pagination;
  keyword?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
  };
}

export interface AdminEmail {
  id: number;
  prefix: string;
  postfix: string;
  email: string;
  bindStatus: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEmailListResult {
  list: AdminEmail[];
  pagination: Pagination;
  keyword?: string;
}

export interface SequenceCounter {
  id: number;
  counterName: string;
  currentValue: number;
  updatedAt?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}
