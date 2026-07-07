import type { Prisma } from "@prisma/client";
import type { ShopAccount, ShopAccountListResult } from "@wuliuqi/types";
import type { AccountListQuery } from "@wuliuqi/validators";
import { prisma } from "@wuliuqi/db";
import {
  serializeAccount,
  serializeGameAttributeDefinition,
} from "./serializers";

const CODM_GAME_KEY = "codm";

async function listEnabledCodmAttributeDefinitions() {
  const definitions = await prisma.gameAttributeDefinition.findMany({
    where: {
      gameKey: CODM_GAME_KEY,
      enabled: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return definitions.map(serializeGameAttributeDefinition);
}

export async function listShopAccounts(
  query: AccountListQuery,
): Promise<ShopAccountListResult> {
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
    prisma.codmAccount.count({ where }),
    prisma.codmAccount.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    listEnabledCodmAttributeDefinitions(),
  ]);

  return {
    list: accounts.map((account) =>
      serializeAccount(account, attributeDefinitions),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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
): Promise<ShopAccount | null> {
  const [account, attributeDefinitions] = await Promise.all([
    prisma.codmAccount.findUnique({
      where: { id },
    }),
    listEnabledCodmAttributeDefinitions(),
  ]);

  return account ? serializeAccount(account, attributeDefinitions) : null;
}
