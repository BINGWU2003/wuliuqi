import type { Prisma } from "@prisma/client";
import type {
  AccountAttributePrimitive,
  AccountAttributeValue,
  AccountAttributes,
  AdminEmail,
  AdminUser,
  Carousel,
  CarouselItem,
  GameAttributeDefinition,
  GameAttributeOption,
  GameAttributeType,
  SequenceCounter,
  ShopAccount,
} from "@wuliuqi/types";

type AccountRecord = {
  id: bigint;
  serialNumber: string;
  images: Prisma.JsonValue | null;
  attributes: Prisma.JsonValue;
  price: Prisma.Decimal;
  title: string;
  describe: string | null;
  xianyuUrl: string | null;
  email: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
};

type GameAttributeDefinitionRecord = {
  id: bigint;
  gameKey: string;
  attrKey: string;
  label: string;
  type: string;
  unit: string | null;
  options: Prisma.JsonValue;
  enabled: boolean;
  sortOrder: number;
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
  boundAccountId?: bigint | number | null;
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

export function normalizeAccountAttributes(
  value: Prisma.JsonValue | null,
): AccountAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const attributes: AccountAttributes = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "number" || typeof rawValue === "string") {
      attributes[key] = rawValue;
    }
  }

  return attributes;
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

function normalizeAttributeOptions(
  value: Prisma.JsonValue,
): GameAttributeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: GameAttributeOption[] = [];

  for (const option of value) {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      continue;
    }

    const record = option as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const optionValue = typeof record.value === "string" ? record.value : "";

    if (label && optionValue) {
      options.push({ label, value: optionValue });
    }
  }

  return options;
}

function attributeType(value: string): GameAttributeType {
  return value === "select" ? "select" : "number";
}

function displayAttributeValue(
  value: AccountAttributePrimitive,
  definition: GameAttributeDefinition,
) {
  if (definition.type === "select") {
    return (
      definition.options.find((option) => option.value === value)?.label ??
      String(value)
    );
  }

  return `${value}${definition.unit ? ` ${definition.unit}` : ""}`;
}

export function serializeGameAttributeDefinition(
  definition: GameAttributeDefinitionRecord,
): GameAttributeDefinition {
  return {
    id: bigintToNumber(definition.id),
    gameKey: definition.gameKey,
    attrKey: definition.attrKey,
    label: definition.label,
    type: attributeType(definition.type),
    unit: definition.unit ?? undefined,
    options: normalizeAttributeOptions(definition.options),
    enabled: definition.enabled,
    sortOrder: definition.sortOrder,
    createdAt: toIsoString(definition.createdAt),
    updatedAt: toIsoString(definition.updatedAt),
  };
}

export function serializeAccountAttributeValues(
  attributes: AccountAttributes,
  definitions: GameAttributeDefinition[],
): AccountAttributeValue[] {
  return definitions
    .filter((definition) => definition.enabled)
    .flatMap((definition) => {
      const value = attributes[definition.attrKey];

      if (value === undefined || value === "") {
        return [];
      }

      return [
        {
          key: definition.attrKey,
          label: definition.label,
          type: definition.type,
          value,
          displayValue: displayAttributeValue(value, definition),
          unit: definition.unit,
          sortOrder: definition.sortOrder,
        },
      ];
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function serializeAccount(
  account: AccountRecord,
  definitions: GameAttributeDefinition[] = [],
): ShopAccount {
  const attributes = normalizeAccountAttributes(account.attributes);

  return {
    id: bigintToNumber(account.id),
    serialNumber: account.serialNumber,
    images: normalizeImages(account.images),
    attributes,
    attributeValues: serializeAccountAttributeValues(attributes, definitions),
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
  const boundAccountId =
    typeof email.boundAccountId === "bigint"
      ? bigintToNumber(email.boundAccountId)
      : typeof email.boundAccountId === "number"
        ? email.boundAccountId
        : undefined;

  return {
    id: bigintToNumber(email.id),
    prefix: email.prefix,
    postfix: email.postfix,
    email: `${email.prefix}${email.postfix}`,
    bindStatus: email.bindStatus,
    ...(boundAccountId === undefined ? {} : { boundAccountId }),
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
