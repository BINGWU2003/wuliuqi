import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_SORT } from "@wuliuqi/types";

const { prismaMock } = vi.hoisted(() => {
  const mock = {
    codmAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    sanguoshaAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    gameAttributeDefinition: {
      findMany: vi.fn(),
    },
  };

  return { prismaMock: mock };
});

vi.mock("@wuliuqi/db", () => ({
  prisma: prismaMock,
}));

import {
  listShopHomeAccounts,
  listShopAccounts,
  listShopRecentAccountsByGame,
} from "./shop-accounts";

const baseDate = new Date("2026-07-08T00:00:00.000Z");

function accountRecord(
  patch: Partial<{
    id: bigint;
    serialNumber: string;
    images: string[];
    attributes: Record<string, number | string>;
    price: number;
    title: string;
    describe: string | null;
    xianyuUrl: string | null;
    email: string | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 1n,
    serialNumber: "#CODM-1",
    images: [],
    attributes: {},
    price: 99,
    title: "测试账号",
    describe: "测试描述",
    xianyuUrl: null,
    email: null,
    status: 1,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...patch,
  };
}

function attributeDefinitionRecord(
  patch: Partial<{
    id: bigint;
    gameKey: string;
    attrKey: string;
    label: string;
    type: string;
    unit: string | null;
    options: Array<{ label: string; value: string }>;
    enabled: boolean;
    sortOrder: number;
    deletedAt: Date | null;
  }> = {},
) {
  return {
    id: 1n,
    gameKey: "codm",
    attrKey: "level",
    label: "等级",
    type: "number",
    unit: "级",
    options: [],
    enabled: true,
    sortOrder: 0,
    createdAt: baseDate,
    updatedAt: baseDate,
    deletedAt: null,
    ...patch,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(baseDate);
});

describe("商城账号", () => {
  it("首页账号流同时查询 CODM 和三国杀最近三个月已上架账号并合并分页", async () => {
    prismaMock.codmAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 11n,
        email: "codm11@example.com",
        serialNumber: "#CODM-11",
        createdAt: new Date("2026-07-06T00:00:00.000Z"),
      }),
      accountRecord({
        id: 10n,
        serialNumber: "#CODM-10",
        createdAt: new Date("2026-07-03T00:00:00.000Z"),
      }),
    ]);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 62n,
        email: "sgs62@example.com",
        serialNumber: "#SGS-62",
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
      }),
      accountRecord({
        id: 61n,
        serialNumber: "#SGS-61",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const result = await listShopHomeAccounts({ limit: 3, months: 3 });

    expect(prismaMock.codmAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 4,
    });
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 4,
    });
    expect(result.list.map((account) => account.serialNumber)).toEqual([
      "#SGS-62",
      "#CODM-11",
      "#SGS-61",
    ]);
    expect(result.list[0]).not.toHaveProperty("email");
    expect(result.nextCursor).toBeTruthy();
  });

  it("首页账号流根据 cursor 查询下一页", async () => {
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: "2026-07-05T00:00:00.000Z",
        gameKey: "sanguosha",
        id: 61,
      }),
      "utf8",
    ).toString("base64url");

    prismaMock.codmAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 10n,
        serialNumber: "#CODM-10",
        createdAt: new Date("2026-07-03T00:00:00.000Z"),
      }),
    ]);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 60n,
        serialNumber: "#SGS-60",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const result = await listShopHomeAccounts({
      cursor,
      limit: 2,
      months: 3,
    });

    expect(prismaMock.codmAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ createdAt: { lt: new Date("2026-07-05T00:00:00.000Z") } }],
        }),
      }),
    );
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { createdAt: { lt: new Date("2026-07-05T00:00:00.000Z") } },
            {
              createdAt: new Date("2026-07-05T00:00:00.000Z"),
              id: { lt: 61 },
            },
          ],
        }),
      }),
    );
    expect(result.list.map((account) => account.serialNumber)).toEqual([
      "#SGS-60",
      "#CODM-10",
    ]);
  });

  it("首页账号流支持按游戏分类筛选", async () => {
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 61n,
        serialNumber: "#SGS-61",
        createdAt: new Date("2026-07-05T00:00:00.000Z"),
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const result = await listShopHomeAccounts({
      game_key: "sanguosha",
      limit: 12,
      months: 3,
    });

    expect(prismaMock.codmAccount.findMany).not.toHaveBeenCalled();
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 13,
    });
    expect(prismaMock.gameAttributeDefinition.findMany).toHaveBeenCalledWith({
      where: {
        gameKey: "sanguosha",
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    expect(result.list.map((account) => account.serialNumber)).toEqual([
      "#SGS-61",
    ]);
  });

  it("首页账号流支持价格区间和价格排序", async () => {
    prismaMock.codmAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 11n,
        serialNumber: "#CODM-11",
        price: 1200,
        createdAt: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ]);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 62n,
        serialNumber: "#SGS-62",
        price: 900,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const result = await listShopHomeAccounts({
      limit: 2,
      max_price: 2000,
      min_price: 500,
      months: 3,
      sort: ACCOUNT_SORT.priceAsc,
    });

    expect(prismaMock.codmAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
        price: {
          gte: 500,
          lte: 2000,
        },
      },
      orderBy: [{ price: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 3,
    });
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
        price: {
          gte: 500,
          lte: 2000,
        },
      },
      orderBy: [{ price: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 3,
    });
    expect(result.list.map((account) => account.serialNumber)).toEqual([
      "#SGS-62",
      "#CODM-11",
    ]);
  });

  it("按游戏查询三国杀账号列表并加载三国杀属性", async () => {
    prismaMock.sanguoshaAccount.count.mockResolvedValue(1);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 61n,
        serialNumber: "#SGS-61",
        email: "sgs61@example.com",
        attributes: { generals: 120 },
        title: "三国杀账号",
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        gameKey: "sanguosha",
        attrKey: "generals",
        label: "武将数",
      }),
    ]);

    const result = await listShopAccounts({
      game_key: "sanguosha",
      keyword: undefined,
      page: 1,
      limit: 12,
      status: 1,
      sort: ACCOUNT_SORT.latest,
    });

    expect(prismaMock.sanguoshaAccount.count).toHaveBeenCalledWith({
      where: { status: 1 },
    });
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: { status: 1 },
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 12,
    });
    expect(prismaMock.codmAccount.findMany).not.toHaveBeenCalled();
    expect(prismaMock.gameAttributeDefinition.findMany).toHaveBeenCalledWith({
      where: {
        gameKey: "sanguosha",
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    expect(result.list[0]).toMatchObject({
      serialNumber: "#SGS-61",
      attributeValues: [
        expect.objectContaining({
          key: "generals",
          label: "武将数",
          value: 120,
        }),
      ],
    });
    expect(result.list[0]).not.toHaveProperty("email");
  });

  it("按公开白名单应用 CODM 神话和传说数量筛选", async () => {
    prismaMock.codmAccount.count.mockResolvedValue(0);
    prismaMock.codmAccount.findMany.mockResolvedValue([]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    await listShopAccounts({
      game_key: "codm",
      keyword: undefined,
      page: 1,
      limit: 12,
      status: 1,
      sort: ACCOUNT_SORT.latest,
      mythic_min: 10,
      mythic_max: 19,
      legendary_min: 30,
    });

    const where = {
      status: 1,
      AND: [
        {
          attributes: {
            path: ["mythic_skins"],
            gte: 10,
            lte: 19,
          },
        },
        {
          attributes: {
            path: ["legendary_skins"],
            gte: 30,
          },
        },
      ],
    };

    expect(prismaMock.codmAccount.count).toHaveBeenCalledWith({ where });
    expect(prismaMock.codmAccount.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 12,
    });
  });

  it("首页分区只查询最近三个月的已上架账号", async () => {
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 62n,
        email: "sgs62@example.com",
        serialNumber: "#SGS-62",
        createdAt: new Date("2026-06-18T00:00:00.000Z"),
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const accounts = await listShopRecentAccountsByGame("sanguosha", {
      limit: 6,
      months: 3,
    });

    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {
        status: 1,
        createdAt: {
          gte: new Date("2026-04-08T00:00:00.000Z"),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    expect(accounts[0]).toMatchObject({
      serialNumber: "#SGS-62",
    });
    expect(accounts[0]).not.toHaveProperty("email");
  });
});
