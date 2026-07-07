import type { ShopAccount } from "@wuliuqi/types";

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

export function getAccountName(account: ShopAccount) {
  return `[${account.serialNumber}]${account.title}`;
}

export function getAccountBadges(account: ShopAccount) {
  const badges: string[] = [];
  const mythic = account.attributes.mythic_skins;
  const legendary = account.attributes.legendary_skins;

  if (typeof mythic === "number" && Number.isFinite(mythic)) {
    badges.push(`${mythic} 神话`);
  }

  if (typeof legendary === "number" && Number.isFinite(legendary)) {
    badges.push(`${legendary} 传说`);
  }

  if (account.images.length > 0) {
    badges.push(`${account.images.length} 图`);
  }

  return badges.slice(0, 3);
}

export function getStatusLabel(status: number) {
  return status === 1 ? "可购买" : "已下架";
}
