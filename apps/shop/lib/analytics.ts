import type { GameKey, ShopAccount } from "@wuliuqi/types";
import posthog from "posthog-js";

export const SHOP_ACCOUNT_DETAIL_VIEWED_EVENT =
  "shop_account_detail_viewed";
export const SHOP_ACCOUNT_XIANYU_CLICKED_EVENT =
  "shop_account_xianyu_clicked";
export const SHOP_ACCOUNT_CONTACT_CLICKED_EVENT =
  "shop_account_contact_clicked";

export type AccountDetailPresentation = "page" | "modal";
export type AccountContactMethod = "wechat" | "xianyu";

type AccountAnalyticsSource = Pick<
  ShopAccount,
  "gameKey" | "id" | "price" | "serialNumber" | "title"
>;

let initialized = false;

export function accountAnalyticsProperties(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
) {
  return {
    account_key: accountAnalyticsKey(account.gameKey, account.id),
    account_id: account.id,
    game_key: account.gameKey,
    serial_number: account.serialNumber,
    title: account.title,
    price: account.price,
    presentation,
  } as const;
}

export function accountAnalyticsKey(gameKey: GameKey, accountId: number) {
  return `${gameKey}:${accountId}`;
}

export function accountViewEventKey(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
) {
  return `${presentation}:${accountAnalyticsKey(account.gameKey, account.id)}`;
}

export function captureAccountDetailViewed(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
) {
  capture(
    SHOP_ACCOUNT_DETAIL_VIEWED_EVENT,
    accountAnalyticsProperties(account, presentation),
  );
}

export function captureAccountDetailViewedOnce(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
  previousEventKey: string | null,
) {
  const eventKey = accountViewEventKey(account, presentation);

  if (previousEventKey !== eventKey) {
    captureAccountDetailViewed(account, presentation);
  }

  return eventKey;
}

export function captureAccountXianyuClicked(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
) {
  capture(
    SHOP_ACCOUNT_XIANYU_CLICKED_EVENT,
    accountAnalyticsProperties(account, presentation),
  );
}

export function captureAccountContactClicked(
  account: AccountAnalyticsSource,
  presentation: AccountDetailPresentation,
  contactMethod: AccountContactMethod,
) {
  capture(SHOP_ACCOUNT_CONTACT_CLICKED_EVENT, {
    ...accountAnalyticsProperties(account, presentation),
    contact_method: contactMethod,
  });
}

export function ensurePostHogInitialized() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const proxyReady =
    process.env.NEXT_PUBLIC_POSTHOG_PROXY_READY === "true";

  if (typeof window === "undefined" || !key || !proxyReady) {
    return null;
  }

  if (!initialized) {
    posthog.init(key, {
      api_host: "/ingest",
      autocapture: true,
      capture_pageleave: true,
      capture_pageview: false,
      cookieless_mode: "always",
      defaults: "2026-05-30",
      disable_session_recording: true,
      person_profiles: "identified_only",
    });
    initialized = true;
  }

  return posthog;
}

function capture(event: string, properties: Record<string, unknown>) {
  ensurePostHogInitialized()?.capture(event, properties);
}
