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
  attributes: AccountAttributes;
  attributeValues: AccountAttributeValue[];
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
  boundAccountId?: number;
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

export type GameAttributeType = "number" | "select";

export type AccountAttributePrimitive = number | string;

export type AccountAttributes = Record<string, AccountAttributePrimitive>;

export interface GameAttributeOption {
  label: string;
  value: string;
}

export interface GameAttributeDefinition {
  id: number;
  gameKey: string;
  attrKey: string;
  label: string;
  type: GameAttributeType;
  unit?: string;
  options: GameAttributeOption[];
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  usageCount?: number;
}

export interface AccountAttributeValue {
  key: string;
  label: string;
  type: GameAttributeType;
  enabled: boolean;
  value: AccountAttributePrimitive;
  displayValue: string;
  unit?: string;
  sortOrder: number;
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

export interface UploadCredential {
  key: string;
  url: string;
  bucket: string;
  region: string;
  size: number;
  contentType: string;
  startTime: number;
  expiredTime: number;
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
  };
}

export type KnowledgeStatus = "draft" | "published" | "archived";
export type KnowledgeVisibility = "public" | "private";
export type KnowledgeIndexStatus =
  "pending" | "indexing" | "indexed" | "failed";

export interface KnowledgeBase {
  id: string;
  slug: string;
  name: string;
  description?: string;
  visibility: KnowledgeVisibility;
  status: KnowledgeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeCategory {
  id: string;
  knowledgeBaseId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeArticle {
  id: string;
  knowledgeBaseId: string;
  categoryId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: KnowledgeStatus;
  indexStatus: KnowledgeIndexStatus;
  indexError?: string;
  tags: string[];
  sortOrder: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FaqItem {
  id: string;
  knowledgeBaseId: string;
  categoryId?: string;
  question: string;
  answer: string;
  aliases: string[];
  status: KnowledgeStatus;
  indexStatus: KnowledgeIndexStatus;
  indexError?: string;
  tags: string[];
  sortOrder: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeChunk {
  id: string;
  knowledgeBaseId: string;
  sourceType: "article" | "faq";
  sourceId: string;
  title: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface KnowledgeSearchResult {
  id: string;
  type: "article" | "faq";
  title: string;
  excerpt?: string;
  categoryName?: string;
  href: string;
}

export interface RagMessageSource {
  title: string;
  href: string;
  sourceType: "article" | "faq";
  sourceId: string;
  score?: number;
}

export interface RagConversation {
  id: string;
  knowledgeBaseId: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RagMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: RagMessageSource[];
  createdAt?: string;
}

export interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}
