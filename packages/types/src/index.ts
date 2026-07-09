export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ConstValue<T extends Record<string, string | number>> = T[keyof T];

export const GAME_KEY = {
  codm: "codm",
  sanguosha: "sanguosha",
} as const;
export const GAME_KEYS = [GAME_KEY.codm, GAME_KEY.sanguosha] as const;
export type GameKey = (typeof GAME_KEYS)[number];
export const DEFAULT_GAME_KEY: GameKey = GAME_KEY.codm;
export const HOME_GAME_FILTER = {
  ...GAME_KEY,
  all: "all",
} as const;
export const HOME_GAME_FILTERS = [
  HOME_GAME_FILTER.codm,
  HOME_GAME_FILTER.sanguosha,
  HOME_GAME_FILTER.all,
] as const;
export type HomeGameFilter = (typeof HOME_GAME_FILTERS)[number];

export const ACCOUNT_STATUS = {
  listed: 1,
  unlisted: 2,
  sold: 3,
} as const;
export type AccountStatus = ConstValue<typeof ACCOUNT_STATUS>;
export type AccountWritableStatus =
  | typeof ACCOUNT_STATUS.listed
  | typeof ACCOUNT_STATUS.unlisted;
export const ACCOUNT_STATUS_VALUES = [
  ACCOUNT_STATUS.listed,
  ACCOUNT_STATUS.unlisted,
  ACCOUNT_STATUS.sold,
] as const;
export const ACCOUNT_WRITABLE_STATUS_VALUES = [
  ACCOUNT_STATUS.listed,
  ACCOUNT_STATUS.unlisted,
] as const;
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [ACCOUNT_STATUS.listed]: "已上架",
  [ACCOUNT_STATUS.unlisted]: "已下架",
  [ACCOUNT_STATUS.sold]: "已出售",
};

export const EMAIL_BIND_STATUS = {
  bound: 1,
  unbound: 2,
} as const;
export type EmailBindStatus = ConstValue<typeof EMAIL_BIND_STATUS>;
export const EMAIL_BIND_STATUS_VALUES = [
  EMAIL_BIND_STATUS.bound,
  EMAIL_BIND_STATUS.unbound,
] as const;
export const EMAIL_BIND_STATUS_LABELS: Record<EmailBindStatus, string> = {
  [EMAIL_BIND_STATUS.bound]: "已绑定",
  [EMAIL_BIND_STATUS.unbound]: "未绑定",
};

export const ACCOUNT_SORT = {
  latest: "latest",
  priceAsc: "price_asc",
  priceDesc: "price_desc",
} as const;
export const ACCOUNT_SORT_VALUES = [
  ACCOUNT_SORT.latest,
  ACCOUNT_SORT.priceAsc,
  ACCOUNT_SORT.priceDesc,
] as const;
export type AccountSort = (typeof ACCOUNT_SORT_VALUES)[number];

export const GAME_ATTRIBUTE_TYPES = ["number", "select"] as const;
export type GameAttributeType = (typeof GAME_ATTRIBUTE_TYPES)[number];

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
export type KnowledgeIndexStatus = ConstValue<typeof KNOWLEDGE_INDEX_STATUS>;
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

export const CHAT_ROLE = {
  user: "user",
  assistant: "assistant",
  system: "system",
} as const;
export const CHAT_ROLES = [
  CHAT_ROLE.user,
  CHAT_ROLE.assistant,
  CHAT_ROLE.system,
] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export interface GameOption {
  key: GameKey;
  label: string;
  shortLabel: string;
  accountListPath: string;
}

export interface ShopAccount {
  id: number;
  gameKey: GameKey;
  serialNumber: string;
  images: string[];
  attributes: AccountAttributes;
  attributeValues: AccountAttributeValue[];
  price: number;
  title: string;
  description: string;
  xianyuUrl: string;
  email: string;
  status: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type PublicShopAccount = Omit<ShopAccount, "email">;

export interface ShopAccountListResult {
  list: PublicShopAccount[];
  pagination: Pagination;
  gameKey: GameKey;
  keyword?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
  };
}

export interface ShopHomeAccountListResult {
  list: PublicShopAccount[];
  nextCursor?: string;
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

export interface AdminAccount extends ShopAccount {
  costPrice: number;
  soldPrice?: number;
  soldAt?: string;
  profit?: number;
}

export interface AdminAccountListResult {
  list: AdminAccount[];
  pagination: Pagination;
  gameKey: GameKey;
  keyword?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
  };
}

export interface AdminAccountStatisticsStatus {
  status: AccountStatus;
  label: string;
  count: number;
  totalValue: number;
  totalCost: number;
  totalRevenue: number;
}

export interface AdminAccountStatistics {
  summary: {
    totalCount: number;
    listedCount: number;
    unlistedCount: number;
    soldCount: number;
    totalValue: number;
    totalCost: number;
    listedValue: number;
    listedCost: number;
    unlistedValue: number;
    unlistedCost: number;
    soldValue: number;
    soldRevenue: number;
    soldCost: number;
    soldProfit: number;
    availableValue: number;
    availableCost: number;
    availableEstimatedProfit: number;
  };
  statusBreakdown: AdminAccountStatisticsStatus[];
  recentSold: AdminAccount[];
  highValueAvailable: AdminAccount[];
  staleListed: AdminAccount[];
}

export interface AdminEmail {
  id: number;
  gameKey: GameKey;
  prefix: string;
  postfix: string;
  email: string;
  bindStatus: EmailBindStatus;
  boundAccountId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEmailListResult {
  list: AdminEmail[];
  pagination: Pagination;
  gameKey: GameKey;
  keyword?: string;
}

export interface AdminEmailPostfix {
  id: number;
  postfix: string;
  enabled: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SequenceCounter {
  id: number;
  counterName: string;
  currentValue: number;
  gameKey?: GameKey;
  gameLabel?: string;
  purpose?: string;
  displayName?: string;
  updatedAt?: string;
}

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

export interface RagMessageSource {
  title: string;
  href: string;
  sourceType: KnowledgeSourceType;
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
  role: ChatRole;
  content: string;
  sources: RagMessageSource[];
  createdAt?: string;
}

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}
