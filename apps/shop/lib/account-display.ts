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
  const source = `${account.title} ${account.description}`;
  const badges: string[] = [];
  const mythic = source.match(/(\d+)\s*神(?:话)?/);
  const legendary = source.match(/(\d+)\s*传(?:说)?/);

  if (mythic?.[1]) {
    badges.push(`${mythic[1]} 神话`);
  }

  if (legendary?.[1]) {
    badges.push(`${legendary[1]} 传说`);
  }

  if (account.images.length > 0) {
    badges.push(`${account.images.length} 图`);
  }

  return badges.slice(0, 3);
}

export function getStatusLabel(status: number) {
  return status === 1 ? "可购买" : "已下架";
}
