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
