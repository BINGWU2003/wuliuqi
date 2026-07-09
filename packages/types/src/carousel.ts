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
