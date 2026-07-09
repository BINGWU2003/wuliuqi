import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_LABELS,
  GAME_KEY,
} from "@wuliuqi/types";
import type { AccountStatus, PublicShopAccount } from "@wuliuqi/types";

export function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "CNY",
  }).format(price);
}

export function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAccountName(account: PublicShopAccount) {
  return `[${account.serialNumber}]${account.title}`;
}

export function getAccountBadges(account: PublicShopAccount) {
  if (account.gameKey === GAME_KEY.sanguosha) {
    return getGenericAttributeBadgesWithImages(account);
  }

  const badges = getCodmAttributeBadges(account);

  if (account.images.length > 0) {
    badges.push(`${account.images.length} 图`);
  }

  return badges.slice(0, 3);
}

export function getAccountCardBadges(account: PublicShopAccount) {
  const gameLabel =
    account.gameKey === GAME_KEY.sanguosha ? "三国杀" : "CODM";

  return [gameLabel, ...getGenericAttributeBadges(account)].slice(0, 3);
}

function getCodmAttributeBadges(account: PublicShopAccount) {
  const badges: string[] = [];
  const mythic = account.attributes.mythic_skins;
  const legendary = account.attributes.legendary_skins;

  if (typeof mythic === "number" && Number.isFinite(mythic)) {
    badges.push(`${mythic} 神话`);
  }

  if (typeof legendary === "number" && Number.isFinite(legendary)) {
    badges.push(`${legendary} 传说`);
  }

  return badges;
}

function getGenericAttributeBadges(account: PublicShopAccount) {
  return account.attributeValues
    .filter((attribute) => attribute.displayValue)
    .slice(0, 2)
    .map((attribute) => `${attribute.label} ${attribute.displayValue}`);
}

function getGenericAttributeBadgesWithImages(account: PublicShopAccount) {
  const badges = getGenericAttributeBadges(account);
  if (account.images.length > 0) {
    badges.push(`${account.images.length} 图`);
  }

  return badges.slice(0, 3);
}

export function getStatusLabel(status: AccountStatus) {
  if (status === ACCOUNT_STATUS.listed) {
    return "可购买";
  }

  return status === ACCOUNT_STATUS.sold
    ? ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.sold]
    : ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.unlisted];
}
