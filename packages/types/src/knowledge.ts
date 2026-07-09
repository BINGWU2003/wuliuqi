type ConstValue<T extends Record<string, string | number>> = T[keyof T];

export const KNOWLEDGE_STATUS = {
  draft: "draft",
  published: "published",
  archived: "archived",
} as const;
export type KnowledgeStatus = ConstValue<typeof KNOWLEDGE_STATUS>;
export const KNOWLEDGE_STATUS_VALUES = [
  KNOWLEDGE_STATUS.draft,
  KNOWLEDGE_STATUS.published,
  KNOWLEDGE_STATUS.archived,
] as const;

export const KNOWLEDGE_VISIBILITY = {
  public: "public",
  private: "private",
} as const;
export type KnowledgeVisibility = ConstValue<typeof KNOWLEDGE_VISIBILITY>;
export const KNOWLEDGE_VISIBILITY_VALUES = [
  KNOWLEDGE_VISIBILITY.public,
  KNOWLEDGE_VISIBILITY.private,
] as const;

export const KNOWLEDGE_INDEX_STATUS = {
  pending: "pending",
  indexing: "indexing",
  indexed: "indexed",
  failed: "failed",
} as const;
export type KnowledgeIndexStatus = ConstValue<
  typeof KNOWLEDGE_INDEX_STATUS
>;
export const KNOWLEDGE_INDEX_STATUS_VALUES = [
  KNOWLEDGE_INDEX_STATUS.pending,
  KNOWLEDGE_INDEX_STATUS.indexing,
  KNOWLEDGE_INDEX_STATUS.indexed,
  KNOWLEDGE_INDEX_STATUS.failed,
] as const;

export const KNOWLEDGE_SOURCE_TYPE = {
  article: "article",
  faq: "faq",
} as const;
export type KnowledgeSourceType = ConstValue<typeof KNOWLEDGE_SOURCE_TYPE>;
export const KNOWLEDGE_SOURCE_TYPE_VALUES = [
  KNOWLEDGE_SOURCE_TYPE.article,
  KNOWLEDGE_SOURCE_TYPE.faq,
] as const;

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
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface KnowledgeSearchResult {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  excerpt?: string;
  categoryName?: string;
  href: string;
}
