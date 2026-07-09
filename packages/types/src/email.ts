import type { Pagination } from "./api";
import type { GameKey } from "./game";

type ConstValue<T extends Record<string, string | number>> = T[keyof T];

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
