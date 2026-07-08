import type { Prisma } from "@prisma/client";
import type {
  GameKey,
  ShopAccount,
  ShopAccountListResult,
  ShopHomeAccountListResult,
} from "@wuliuqi/types";
import type {
  AccountListQuery,
  ShopHomeAccountListQuery,
} from "@wuliuqi/validators";
import { prisma } from "@wuliuqi/db";
import { GAME_OPTIONS, accountDelegate, normalizeGameKey } from "./games";
import {
  serializeAccount,
  serializeGameAttributeDefinition,
} from "./serializers";
import type { AccountRecord } from "./serializers";

const CODM_GAME_KEY: GameKey = "codm";
const ACCOUNT_LISTED_STATUS = 1;
const HOME_RECENT_MONTHS = 3;
const gameOrder = new Map<GameKey, number>([
  ["codm", 0],
  ["sanguosha", 1],
]);

type HomeCursor = {
  createdAt: string;
  gameKey: GameKey;
  id: number;
};

type HomeAccountRecord = {
  account: AccountRecord;
  gameKey: GameKey;
};

async function listAttributeDefinitions(gameKey: GameKey) {
  const definitions = await prisma.gameAttributeDefinition.findMany({
    where: {
      gameKey,
      deletedAt: null,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return definitions.map(serializeGameAttributeDefinition);
}

function recentCreatedAfter(months = HOME_RECENT_MONTHS) {
  const createdAfter = new Date();

  createdAfter.setMonth(createdAfter.getMonth() - months);

  return createdAfter;
}

function decodeHomeCursor(cursor?: string): HomeCursor | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<HomeCursor>;

    if (
      typeof parsed.createdAt === "string" &&
      (parsed.gameKey === "codm" || parsed.gameKey === "sanguosha") &&
      typeof parsed.id === "number" &&
      Number.isSafeInteger(parsed.id)
    ) {
      return {
        createdAt: parsed.createdAt,
        gameKey: parsed.gameKey,
        id: parsed.id,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function encodeHomeCursor(account: ShopAccount) {
  if (!account.createdAt) {
    return undefined;
  }

  return Buffer.from(
    JSON.stringify({
      createdAt: account.createdAt,
      gameKey: account.gameKey,
      id: account.id,
    }),
    "utf8",
  ).toString("base64url");
}

function homeCursorWhere(gameKey: GameKey, cursor: HomeCursor | null) {
  if (!cursor) {
    return {};
  }

  const cursorDate = new Date(cursor.createdAt);
  const currentGameOrder = gameOrder.get(gameKey) ?? 0;
  const cursorGameOrder = gameOrder.get(cursor.gameKey) ?? 0;
  const conditions: Prisma.CodmAccountWhereInput[] = [
    { createdAt: { lt: cursorDate } },
  ];

  if (currentGameOrder > cursorGameOrder) {
    conditions.push({ createdAt: cursorDate });
  } else if (currentGameOrder === cursorGameOrder) {
    conditions.push({
      createdAt: cursorDate,
      id: { lt: cursor.id },
    });
  }

  return { OR: conditions };
}

function sortHomeAccounts(first: HomeAccountRecord, second: HomeAccountRecord) {
  const createdDelta =
    second.account.createdAt.getTime() - first.account.createdAt.getTime();

  if (createdDelta !== 0) {
    return createdDelta;
  }

  const gameDelta =
    (gameOrder.get(first.gameKey) ?? 0) - (gameOrder.get(second.gameKey) ?? 0);

  if (gameDelta !== 0) {
    return gameDelta;
  }

  return Number(second.account.id - first.account.id);
}

export async function listShopHomeAccounts(
  query: Partial<ShopHomeAccountListQuery> & { limit: number; months?: number },
): Promise<ShopHomeAccountListResult> {
  const limit = query.limit;
  const cursor = decodeHomeCursor(query.cursor);
  const createdAfter = recentCreatedAfter(query.months);

  const [definitionEntries, accountEntries] = await Promise.all([
    Promise.all(
      GAME_OPTIONS.map(async (game) => [
        game.key,
        await listAttributeDefinitions(game.key),
      ] as const),
    ),
    Promise.all(
      GAME_OPTIONS.map(async (game) => {
        const accounts = await accountDelegate(prisma, game.key).findMany({
          where: {
            status: ACCOUNT_LISTED_STATUS,
            createdAt: {
              gte: createdAfter,
            },
            ...homeCursorWhere(game.key, cursor),
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limit + 1,
        });

        return (accounts as AccountRecord[]).map((account) => ({
          account,
          gameKey: game.key,
        }));
      }),
    ),
  ]);
  const definitionsByGame = new Map(definitionEntries);
  const merged = accountEntries.flat().sort(sortHomeAccounts);
  const pageAccounts = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  const list = pageAccounts.map(({ account, gameKey }) =>
    serializeAccount(account, definitionsByGame.get(gameKey) ?? [], gameKey),
  );
  const lastAccount = list.at(-1);

  return {
    list,
    ...(hasMore && lastAccount
      ? { nextCursor: encodeHomeCursor(lastAccount) }
      : {}),
  };
}

export async function listShopAccounts(
  query: AccountListQuery,
): Promise<ShopAccountListResult> {
  const gameKey = normalizeGameKey(query.game_key);
  const accountsDelegate = accountDelegate(prisma, gameKey);
  const page = query.page;
  const limit = query.limit;
  const where: Prisma.CodmAccountWhereInput = {};

  if (query.status !== undefined) {
    where.status = query.status;
  }

  if (query.min_price !== undefined || query.max_price !== undefined) {
    where.price = {
      gte: query.min_price,
      lte: query.max_price,
    };
  }

  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword } },
      { serialNumber: { contains: query.keyword } },
    ];
  }

  const orderBy: Prisma.CodmAccountOrderByWithRelationInput =
    query.sort === "price_asc"
      ? { price: "asc" }
      : query.sort === "price_desc"
        ? { price: "desc" }
        : { updatedAt: "desc" };

  const [total, accounts, attributeDefinitions] = await Promise.all([
    accountsDelegate.count({ where }),
    accountsDelegate.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    listAttributeDefinitions(gameKey),
  ]);

  return {
    list: (accounts as AccountRecord[]).map((account) =>
      serializeAccount(account, attributeDefinitions, gameKey),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    gameKey,
    keyword: query.keyword,
    priceRange:
      query.min_price !== undefined || query.max_price !== undefined
        ? {
            minPrice: query.min_price,
            maxPrice: query.max_price,
          }
        : undefined,
  };
}

export async function getShopAccountById(
  id: number,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<ShopAccount | null> {
  const gameKey = normalizeGameKey(gameKeyInput);
  const [account, attributeDefinitions] = await Promise.all([
    accountDelegate(prisma, gameKey).findUnique({
      where: { id },
    }),
    listAttributeDefinitions(gameKey),
  ]);

  return account
    ? serializeAccount(account as AccountRecord, attributeDefinitions, gameKey)
    : null;
}

export async function listShopRecentAccountsByGame(
  gameKeyInput: GameKey,
  options: { limit?: number; months?: number } = {},
): Promise<ShopAccount[]> {
  const gameKey = normalizeGameKey(gameKeyInput);
  const limit = options.limit ?? 6;
  const months = options.months ?? 3;
  const createdAfter = new Date();

  createdAfter.setMonth(createdAfter.getMonth() - months);

  const [accounts, attributeDefinitions] = await Promise.all([
    accountDelegate(prisma, gameKey).findMany({
      where: {
        status: ACCOUNT_LISTED_STATUS,
        createdAt: {
          gte: createdAfter,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    listAttributeDefinitions(gameKey),
  ]);

  return (accounts as AccountRecord[]).map((account) =>
    serializeAccount(account, attributeDefinitions, gameKey),
  );
}
