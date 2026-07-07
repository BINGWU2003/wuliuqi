import type { Prisma } from "@prisma/client";
import type { ShopAccount, ShopAccountListResult } from "@wuliuqi/types";
import type { AccountListQuery } from "@wuliuqi/validators";
import { prisma } from "@wuliuqi/db";
import { serializeAccount } from "./serializers";

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

  const total = await prisma.codmAccount.count({ where });
  const accounts = await prisma.codmAccount.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    list: accounts.map(serializeAccount),
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
  const account = await prisma.codmAccount.findUnique({
    where: { id },
  });

  return account ? serializeAccount(account) : null;
}
