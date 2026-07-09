import type { Pagination } from "./api";
import type {
  AccountAttributeValue,
  AccountAttributes,
} from "./attribute";
import type { GameKey } from "./game";

type ConstValue<T extends Record<string, string | number>> = T[keyof T];

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
