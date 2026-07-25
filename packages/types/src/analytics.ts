import type { GameKey } from "./game";

export const TRAFFIC_RANGE_VALUES = ["7d", "30d", "90d"] as const;
export type TrafficRange = (typeof TRAFFIC_RANGE_VALUES)[number];

export const TRAFFIC_GAME_FILTER_VALUES = [
  "all",
  "codm",
  "sanguosha",
] as const;
export type TrafficGameFilter =
  (typeof TRAFFIC_GAME_FILTER_VALUES)[number];

export interface TrafficTrendPoint {
  date: string;
  visitors: number;
  views: number;
  xianyuClicks: number;
  contactClicks: number;
}

export interface TrafficBreakdownRow {
  key: string;
  label: string;
  value: number;
}

export interface TrafficTopAccount {
  accountKey: string;
  accountId: number;
  gameKey: GameKey;
  serialNumber: string;
  title: string;
  price: number;
  visitors: number;
  views: number;
  xianyuClicks: number;
  wechatContactClicks: number;
  xianyuContactClicks: number;
  contactClicks: number;
  interactionClicks: number;
  conversionRate: number;
}

export interface AdminTrafficStatistics {
  range: TrafficRange;
  gameKey: TrafficGameFilter;
  generatedAt: string;
  summary: {
    visitors: number;
    views: number;
    xianyuClicks: number;
    wechatContactClicks: number;
    xianyuContactClicks: number;
    contactClicks: number;
    interactionClicks: number;
    conversionRate: number;
  };
  trend: TrafficTrendPoint[];
  gameBreakdown: TrafficBreakdownRow[];
  topAccounts: TrafficTopAccount[];
  breakdowns: {
    referrers: TrafficBreakdownRow[];
    countries: TrafficBreakdownRow[];
    devices: TrafficBreakdownRow[];
  };
}
