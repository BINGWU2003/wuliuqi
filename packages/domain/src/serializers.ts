import type { Prisma } from "@prisma/client";
import type {
  AdminEmail,
  AdminUser,
  Carousel,
  CarouselItem,
  SequenceCounter,
  ShopAccount,
} from "@wuliuqi/types";

type AccountRecord = {
  id: bigint;
  serialNumber: string;
  images: Prisma.JsonValue | null;
  price: Prisma.Decimal;
  title: string;
  describe: string | null;
  xianyuUrl: string | null;
  email: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
};

type CarouselRecord = {
  id: bigint;
  name: string;
  items: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type EmailRecord = {
  id: bigint;
  prefix: string;
  postfix: string;
  bindStatus: number;
  createdAt: Date;
  updatedAt: Date;
};

type SequenceCounterRecord = {
  id: bigint;
  counterName: string;
  currentValue: bigint;
  updatedAt: Date;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

function bigintToNumber(value: bigint): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new Error("数据库 ID 超出 JavaScript 安全整数范围");
  }

  return numberValue;
}

function toIsoString(value?: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

function normalizeImages(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCarouselItems(value: Prisma.JsonValue): CarouselItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CarouselItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const sortOrder = Number(record.sort_order ?? record.sortOrder ?? 0);
    const url = typeof record.url === "string" ? record.url : "";
    const linkUrl =
      typeof record.link_url === "string"
        ? record.link_url
        : typeof record.linkUrl === "string"
          ? record.linkUrl
          : undefined;

    if (!url) {
      continue;
    }

    items.push(
      linkUrl === undefined ? { sortOrder, url } : { sortOrder, url, linkUrl },
    );
  }

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function serializeAccount(account: AccountRecord): ShopAccount {
  return {
    id: bigintToNumber(account.id),
    serialNumber: account.serialNumber,
    images: normalizeImages(account.images),
    price: Number(account.price),
    title: account.title,
    description: account.describe ?? "",
    xianyuUrl: account.xianyuUrl ?? "",
    email: account.email ?? "",
    status: account.status,
    createdAt: toIsoString(account.createdAt),
    updatedAt: toIsoString(account.updatedAt),
  };
}

export function serializeCarousel(carousel: CarouselRecord): Carousel {
  return {
    id: bigintToNumber(carousel.id),
    name: carousel.name,
    items: normalizeCarouselItems(carousel.items),
    createdAt: toIsoString(carousel.createdAt),
    updatedAt: toIsoString(carousel.updatedAt),
  };
}

export function serializeEmail(email: EmailRecord): AdminEmail {
  return {
    id: bigintToNumber(email.id),
    prefix: email.prefix,
    postfix: email.postfix,
    email: `${email.prefix}${email.postfix}`,
    bindStatus: email.bindStatus,
    createdAt: toIsoString(email.createdAt),
    updatedAt: toIsoString(email.updatedAt),
  };
}

export function serializeSequenceCounter(
  counter: SequenceCounterRecord,
): SequenceCounter {
  return {
    id: bigintToNumber(counter.id),
    counterName: counter.counterName,
    currentValue: bigintToNumber(counter.currentValue),
    updatedAt: toIsoString(counter.updatedAt),
  };
}

export function serializeUser(user: UserRecord): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
  };
}
