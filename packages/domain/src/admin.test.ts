import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_SORT } from "@wuliuqi/types";

const { prismaMock } = vi.hoisted(() => {
  const mock = {
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    carousel: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    codmAccount: {
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    codmEmail: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    sanguoshaAccount: {
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    sanguoshaEmail: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    gameAttributeDefinition: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    gameEmailPostfix: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sequenceCounter: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  return { prismaMock: mock };
});

vi.mock("@wuliuqi/db", () => ({
  prisma: prismaMock,
}));

import {
  clearAdminGameAttributeDefinitionValues,
  createAdminAccount,
  createAdminEmail,
  createAdminEmailPostfix,
  createAdminGameAttributeDefinition,
  deleteAdminEmail,
  deleteAdminEmailPostfix,
  deleteAdminGameAttributeDefinition,
  getAdminAccountStatistics,
  listAdminEmailPostfixes,
  listAdminAccounts,
  listAdminEmails,
  listAdminGameAttributeDefinitions,
  listSequenceCounters,
  sellAdminAccount,
  updateAdminAccount,
  updateAdminAccountStatus,
  updateAdminEmail,
  updateAdminEmailBindStatus,
  updateAdminEmailPostfix,
  updateAdminGameAttributeDefinition,
} from "./admin";

const baseDate = new Date("2026-07-07T00:00:00.000Z");

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
    attrKey: "mythic_skins",
    label: "神话皮肤",
    type: "number",
    unit: "个",
    options: [],
    enabled: true,
    sortOrder: 0,
    createdAt: baseDate,
    updatedAt: baseDate,
    deletedAt: null,
    ...patch,
  };
}

function accountRecord(
  patch: Partial<{
    id: bigint;
    serialNumber: string;
    images: string[];
    attributes: Record<string, number | string>;
    price: number;
    costPrice: number;
    soldPrice: number | null;
    soldAt: Date | null;
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
    id: 7n,
    serialNumber: "#CODM-7",
    images: [],
    attributes: {},
    price: 99,
    costPrice: 60,
    soldPrice: null,
    soldAt: null,
    title: "测试账号",
    describe: "测试描述",
    xianyuUrl: null,
    email: null,
    status: 2,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...patch,
  };
}

function emailRecord(
  patch: Partial<{
    id: bigint;
    prefix: string;
    postfix: string;
    bindStatus: number;
    boundAccountId: bigint | number | null;
  }> = {},
) {
  return {
    id: 3n,
    prefix: "buyer",
    postfix: "@example.com",
    bindStatus: 2,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...patch,
  };
}

function emailPostfixRecord(
  patch: Partial<{
    id: bigint;
    gameKey: string;
    postfix: string;
    enabled: boolean;
    sortOrder: number;
  }> = {},
) {
  return {
    id: 5n,
    gameKey: "codm",
    postfix: "@163.com",
    enabled: true,
    sortOrder: 0,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...patch,
  };
}

function sequenceCounterRecord(
  patch: Partial<{
    id: bigint;
    counterName: string;
    currentValue: bigint;
  }> = {},
) {
  return {
    id: 9n,
    counterName: "CODM_ACCOUNT",
    currentValue: 7n,
    updatedAt: baseDate,
    ...patch,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  prismaMock.$transaction.mockImplementation(async (callback) =>
    callback(prismaMock),
  );
  prismaMock.gameEmailPostfix.findFirst.mockResolvedValue(emailPostfixRecord());
});

describe("后台属性标签", () => {
  it("列出未删除的属性标签并带出使用数量", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({ id: 1n, attrKey: "mythic_skins" }),
      attributeDefinitionRecord({
        id: 2n,
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: null,
        options: [{ label: "传奇战神", value: "legendary" }],
      }),
    ]);
    prismaMock.$queryRaw.mockResolvedValue([
      { id: 1n, usageCount: 23n },
      { id: 2n, usageCount: 0n },
    ]);

    const definitions = await listAdminGameAttributeDefinitions("codm");

    expect(prismaMock.gameAttributeDefinition.findMany).toHaveBeenCalledWith({
      where: {
        gameKey: "codm",
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    expect(definitions).toMatchObject([
      { attrKey: "mythic_skins", usageCount: 23 },
      { attrKey: "rank", usageCount: 0 },
    ]);
  });

  it("创建属性标签时拒绝重复的属性标识", async () => {
    prismaMock.gameAttributeDefinition.findUnique.mockResolvedValue(
      attributeDefinitionRecord(),
    );

    await expect(
      createAdminGameAttributeDefinition({
        gameKey: "codm",
        attrKey: "mythic_skins",
        label: "神话皮肤",
        type: "number",
        unit: "个",
        options: [],
        enabled: true,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_ATTRIBUTE" });
    expect(prismaMock.gameAttributeDefinition.create).not.toHaveBeenCalled();
  });

  it("创建下拉属性标签时拒绝空选项", async () => {
    await expect(
      createAdminGameAttributeDefinition({
        gameKey: "codm",
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: undefined,
        options: [],
        enabled: true,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(
      prismaMock.gameAttributeDefinition.findUnique,
    ).not.toHaveBeenCalled();
    expect(prismaMock.gameAttributeDefinition.create).not.toHaveBeenCalled();
  });

  it("创建数字属性标签时清空选项配置", async () => {
    prismaMock.gameAttributeDefinition.findUnique.mockResolvedValue(null);
    prismaMock.gameAttributeDefinition.create.mockResolvedValue(
      attributeDefinitionRecord(),
    );

    await createAdminGameAttributeDefinition({
      gameKey: "codm",
      attrKey: "mythic_skins",
      label: "神话皮肤",
      type: "number",
      unit: "个",
      options: [{ label: "不应保留", value: "unused" }],
      enabled: true,
      sortOrder: 0,
    });

    expect(prismaMock.gameAttributeDefinition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attrKey: "mythic_skins",
        options: [],
      }),
    });
  });

  it("属性标签已被账号使用时禁止修改标识或类型", async () => {
    prismaMock.gameAttributeDefinition.findFirst.mockResolvedValue(
      attributeDefinitionRecord(),
    );
    prismaMock.$queryRaw.mockResolvedValue([{ usageCount: 2n }]);

    await expect(
      updateAdminGameAttributeDefinition(1, {
        attrKey: "legendary_skins",
      }),
    ).rejects.toMatchObject({
      code: "ATTRIBUTE_IN_USE",
      status: 409,
    });
    expect(prismaMock.gameAttributeDefinition.update).not.toHaveBeenCalled();
  });

  it("属性标签已被账号使用时禁止软删除", async () => {
    prismaMock.gameAttributeDefinition.findFirst.mockResolvedValue(
      attributeDefinitionRecord(),
    );
    prismaMock.$queryRaw.mockResolvedValue([{ usageCount: 23n }]);

    await expect(deleteAdminGameAttributeDefinition(1)).rejects.toMatchObject({
      code: "ATTRIBUTE_IN_USE",
      status: 409,
    });
    expect(prismaMock.gameAttributeDefinition.update).not.toHaveBeenCalled();
  });

  it("软删除未被使用的属性标签", async () => {
    prismaMock.gameAttributeDefinition.findFirst.mockResolvedValue(
      attributeDefinitionRecord(),
    );
    prismaMock.$queryRaw.mockResolvedValue([{ usageCount: 0n }]);
    prismaMock.gameAttributeDefinition.update.mockResolvedValue(
      attributeDefinitionRecord({
        enabled: false,
        deletedAt: new Date("2026-07-08T00:00:00.000Z"),
      }),
    );

    const definition = await deleteAdminGameAttributeDefinition(1);

    expect(prismaMock.gameAttributeDefinition.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        enabled: false,
        deletedAt: expect.any(Date),
      },
    });
    expect(definition).toMatchObject({
      attrKey: "mythic_skins",
      enabled: false,
      deletedAt: "2026-07-08T00:00:00.000Z",
    });
  });

  it("清空账号中指定属性标签的已存值", async () => {
    prismaMock.gameAttributeDefinition.findFirst.mockResolvedValue(
      attributeDefinitionRecord(),
    );
    prismaMock.$executeRaw.mockResolvedValue(23);

    const result = await clearAdminGameAttributeDefinitionValues(1);

    expect(result).toEqual({ clearedCount: 23 });
    expect(prismaMock.$executeRaw).toHaveBeenCalledOnce();
  });
});

describe("后台账号", () => {
  it("按游戏查询后台账号列表并加载对应属性", async () => {
    prismaMock.sanguoshaAccount.count.mockResolvedValue(1);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      accountRecord({
        id: 61n,
        serialNumber: "#SGS-61",
        title: "三国杀账号",
        attributes: { generals: 120 },
      }),
    ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        gameKey: "sanguosha",
        attrKey: "generals",
        label: "武将数",
      }),
    ]);

    const result = await listAdminAccounts({
      game_key: "sanguosha",
      keyword: undefined,
      page: 1,
      limit: 10,
      sort: ACCOUNT_SORT.latest,
    });

    expect(prismaMock.sanguoshaAccount.count).toHaveBeenCalledWith({
      where: {},
    });
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 10,
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
  });

  it("统计账号状态、金额和运营列表", async () => {
    prismaMock.codmAccount.aggregate.mockResolvedValue({
      _count: { _all: 6 },
      _sum: { price: 2850, costPrice: 1510, soldPrice: 1180 },
    });
    prismaMock.codmAccount.groupBy.mockResolvedValue([
      {
        status: 1,
        _count: { _all: 2 },
        _sum: { price: 1200, costPrice: 650, soldPrice: null },
      },
      {
        status: 2,
        _count: { _all: 1 },
        _sum: { price: 400, costPrice: 260, soldPrice: null },
      },
      {
        status: 3,
        _count: { _all: 3 },
        _sum: { price: 1250, costPrice: 600, soldPrice: 1180 },
      },
    ]);
    prismaMock.codmAccount.findMany
      .mockResolvedValueOnce([
        accountRecord({
          id: 31n,
          serialNumber: "#CODM-31",
          price: 800,
          costPrice: 500,
          soldPrice: 760,
          soldAt: new Date("2026-07-08T08:00:00.000Z"),
          status: 3,
          updatedAt: new Date("2026-07-08T08:00:00.000Z"),
        }),
      ])
      .mockResolvedValueOnce([
        accountRecord({
          id: 11n,
          serialNumber: "#CODM-11",
          price: 999,
          status: 1,
        }),
      ])
      .mockResolvedValueOnce([
        accountRecord({
          id: 12n,
          serialNumber: "#CODM-12",
          price: 199,
          status: 1,
          updatedAt: new Date("2026-07-01T08:00:00.000Z"),
        }),
      ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const statistics = await getAdminAccountStatistics();

    expect(prismaMock.codmAccount.aggregate).toHaveBeenCalledWith({
      _count: { _all: true },
      _sum: { price: true, costPrice: true, soldPrice: true },
    });
    expect(prismaMock.codmAccount.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      _count: { _all: true },
      _sum: { price: true, costPrice: true, soldPrice: true },
    });
    expect(prismaMock.codmAccount.findMany).toHaveBeenNthCalledWith(1, {
      where: { status: 3 },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
    expect(prismaMock.codmAccount.findMany).toHaveBeenNthCalledWith(2, {
      where: { status: { in: [1, 2] } },
      orderBy: [{ price: "desc" }, { updatedAt: "desc" }],
      take: 5,
    });
    expect(prismaMock.codmAccount.findMany).toHaveBeenNthCalledWith(3, {
      where: { status: 1 },
      orderBy: { updatedAt: "asc" },
      take: 5,
    });
    expect(statistics.summary).toEqual({
      availableValue: 1600,
      listedCount: 2,
      listedCost: 650,
      listedValue: 1200,
      soldCount: 3,
      soldCost: 600,
      soldProfit: 580,
      soldRevenue: 1180,
      soldValue: 1180,
      totalCount: 6,
      totalCost: 1510,
      totalValue: 2850,
      unlistedCount: 1,
      unlistedCost: 260,
      unlistedValue: 400,
      availableCost: 910,
      availableEstimatedProfit: 690,
    });
    expect(statistics.statusBreakdown).toEqual([
      {
        count: 2,
        label: "已上架",
        status: 1,
        totalCost: 650,
        totalRevenue: 0,
        totalValue: 1200,
      },
      {
        count: 1,
        label: "已下架",
        status: 2,
        totalCost: 260,
        totalRevenue: 0,
        totalValue: 400,
      },
      {
        count: 3,
        label: "已出售",
        status: 3,
        totalCost: 600,
        totalRevenue: 1180,
        totalValue: 1180,
      },
    ]);
    expect(statistics.recentSold[0]).toMatchObject({
      id: 31,
      costPrice: 500,
      profit: 260,
      serialNumber: "#CODM-31",
      soldPrice: 760,
      status: 3,
    });
    expect(statistics.highValueAvailable[0]).toMatchObject({
      id: 11,
      serialNumber: "#CODM-11",
    });
    expect(statistics.staleListed[0]).toMatchObject({
      id: 12,
      serialNumber: "#CODM-12",
    });
  });

  it("按游戏统计三国杀账号，不读取 CODM 账号表", async () => {
    prismaMock.sanguoshaAccount.aggregate.mockResolvedValue({
      _count: { _all: 2 },
      _sum: { price: 1200, costPrice: 720, soldPrice: 460 },
    });
    prismaMock.sanguoshaAccount.groupBy.mockResolvedValue([
      {
        status: 1,
        _count: { _all: 1 },
        _sum: { price: 700, costPrice: 420, soldPrice: null },
      },
      {
        status: 3,
        _count: { _all: 1 },
        _sum: { price: 500, costPrice: 300, soldPrice: 460 },
      },
    ]);
    prismaMock.sanguoshaAccount.findMany
      .mockResolvedValueOnce([
        accountRecord({ id: 62n, serialNumber: "#SGS-62", status: 3 }),
      ])
      .mockResolvedValueOnce([
        accountRecord({ id: 61n, serialNumber: "#SGS-61", status: 1 }),
      ])
      .mockResolvedValueOnce([
        accountRecord({ id: 61n, serialNumber: "#SGS-61", status: 1 }),
      ]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({ gameKey: "sanguosha" }),
    ]);

    const statistics = await getAdminAccountStatistics("sanguosha");

    expect(prismaMock.sanguoshaAccount.aggregate).toHaveBeenCalledOnce();
    expect(prismaMock.sanguoshaAccount.groupBy).toHaveBeenCalledOnce();
    expect(prismaMock.codmAccount.aggregate).not.toHaveBeenCalled();
    expect(prismaMock.gameAttributeDefinition.findMany).toHaveBeenCalledWith({
      where: {
        gameKey: "sanguosha",
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    expect(statistics.summary).toMatchObject({
      totalCount: 2,
      listedCount: 1,
      soldCount: 1,
      availableValue: 700,
      soldCost: 300,
      soldProfit: 160,
      soldRevenue: 460,
      soldValue: 460,
    });
  });

  it("统计账号为空时返回零值和空列表", async () => {
    prismaMock.codmAccount.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { price: null, costPrice: null, soldPrice: null },
    });
    prismaMock.codmAccount.groupBy.mockResolvedValue([]);
    prismaMock.codmAccount.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const statistics = await getAdminAccountStatistics();

    expect(statistics.summary).toEqual({
      availableValue: 0,
      availableCost: 0,
      availableEstimatedProfit: 0,
      listedCount: 0,
      listedCost: 0,
      listedValue: 0,
      soldCount: 0,
      soldCost: 0,
      soldProfit: 0,
      soldRevenue: 0,
      soldValue: 0,
      totalCount: 0,
      totalCost: 0,
      totalValue: 0,
      unlistedCount: 0,
      unlistedCost: 0,
      unlistedValue: 0,
    });
    expect(statistics.statusBreakdown).toEqual([
      {
        count: 0,
        label: "已上架",
        status: 1,
        totalCost: 0,
        totalRevenue: 0,
        totalValue: 0,
      },
      {
        count: 0,
        label: "已下架",
        status: 2,
        totalCost: 0,
        totalRevenue: 0,
        totalValue: 0,
      },
      {
        count: 0,
        label: "已出售",
        status: 3,
        totalCost: 0,
        totalRevenue: 0,
        totalValue: 0,
      },
    ]);
    expect(statistics.recentSold).toEqual([]);
    expect(statistics.highValueAvailable).toEqual([]);
    expect(statistics.staleListed).toEqual([]);
  });

  it("创建上架账号时生成序列号并同步邮箱绑定状态", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        attrKey: "mythic_skins",
        label: "神话皮肤",
      }),
      attributeDefinitionRecord({
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: null,
        options: [{ label: "传奇战神", value: "legendary" }],
        sortOrder: 1,
      }),
    ]);
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 2 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.sequenceCounter.update.mockResolvedValue(
      sequenceCounterRecord({ currentValue: 42n }),
    );
    prismaMock.codmAccount.findUnique.mockResolvedValue(null);
    prismaMock.codmAccount.create.mockResolvedValue(
      accountRecord({
        serialNumber: "#CODM-42",
        attributes: { mythic_skins: 3, rank: "legendary" },
        costPrice: 120,
        email: "buyer@example.com",
        status: 1,
      }),
    );

    const account = await createAdminAccount({
      serialNumber: undefined,
      images: ["https://cdn.example.com/account.jpg"],
      attributes: { mythic_skins: "3", rank: "legendary" },
      price: 199,
      costPrice: 120,
      title: "满级账号",
      description: "测试描述",
      xianyuUrl: "https://www.goofish.com/item/1",
      email: "buyer@example.com",
      status: 1,
    });

    expect(prismaMock.sequenceCounter.update).toHaveBeenCalledWith({
      where: { counterName: "CODM_ACCOUNT" },
      data: { currentValue: { increment: 1 } },
    });
    expect(prismaMock.codmAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        serialNumber: "#CODM-42",
        attributes: { mythic_skins: 3, rank: "legendary" },
        costPrice: 120,
        email: "buyer@example.com",
        status: 1,
      }),
    });
    expect(prismaMock.codmEmail.update).toHaveBeenCalledWith({
      where: { id: 3n },
      data: { bindStatus: 1 },
    });
    expect(account).toMatchObject({
      serialNumber: "#CODM-42",
      attributes: { mythic_skins: 3, rank: "legendary" },
      costPrice: 120,
    });
  });

  it("创建账号时必须绑定邮箱，即使账号初始状态为下架", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    await expect(
      createAdminAccount({
        serialNumber: undefined,
        images: ["https://cdn.example.com/account.jpg"],
        attributes: {},
        price: 199,
        costPrice: 120,
        title: "满级账号",
        description: "测试描述",
        xianyuUrl: undefined,
        email: undefined,
        status: 2,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_REQUIRED" });
    expect(prismaMock.codmAccount.create).not.toHaveBeenCalled();
  });

  it("创建账号时，如果邮箱不存在，应返回业务错误", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);
    prismaMock.codmEmail.findFirst.mockResolvedValue(null);

    await expect(
      createAdminAccount({
        serialNumber: undefined,
        images: ["https://cdn.example.com/account.jpg"],
        attributes: {},
        price: 199,
        costPrice: 120,
        title: "满级账号",
        description: "测试描述",
        xianyuUrl: undefined,
        email: "missing@example.com",
        status: 1,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_NOT_FOUND" });
    expect(prismaMock.codmAccount.create).not.toHaveBeenCalled();
  });

  it("创建账号成功后，会将邮箱标记为已绑定", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 2 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.sequenceCounter.update.mockResolvedValue(
      sequenceCounterRecord({ currentValue: 42n }),
    );
    prismaMock.codmAccount.findUnique.mockResolvedValue(null);
    prismaMock.codmAccount.create.mockResolvedValue(
      accountRecord({
        id: 42n,
        serialNumber: "#CODM-42",
        email: "buyer@example.com",
        status: 1,
      }),
    );
    prismaMock.codmEmail.update.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );

    await createAdminAccount({
      serialNumber: undefined,
      images: ["https://cdn.example.com/account.jpg"],
      attributes: {},
      price: 199,
      costPrice: 120,
      title: "满级账号",
      description: "测试描述",
      xianyuUrl: undefined,
      email: "buyer@example.com",
      status: 1,
    });

    expect(prismaMock.codmEmail.update).toHaveBeenCalledWith({
      where: { id: 3n },
      data: { bindStatus: 1 },
    });
  });

  it("创建三国杀账号时使用独立的序号计数器", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);
    prismaMock.sanguoshaEmail.findFirst.mockResolvedValue(
      emailRecord({ id: 9n, prefix: "sgs", postfix: "@163.com" }),
    );
    prismaMock.sanguoshaAccount.findFirst.mockResolvedValue(null);
    prismaMock.sequenceCounter.update.mockResolvedValue(
      sequenceCounterRecord({
        counterName: "SANGUOSHA_ACCOUNT",
        currentValue: 11n,
      }),
    );
    prismaMock.sanguoshaAccount.findUnique.mockResolvedValue(null);
    prismaMock.sanguoshaAccount.create.mockResolvedValue(
      accountRecord({
        serialNumber: "#SGS-11",
        email: "sgs@163.com",
        status: 1,
      }),
    );

    const account = await createAdminAccount({
      gameKey: "sanguosha",
      serialNumber: undefined,
      images: ["https://cdn.example.com/sgs.jpg"],
      attributes: {},
      price: 199,
      costPrice: 120,
      title: "三国杀账号",
      description: "测试描述",
      xianyuUrl: undefined,
      email: "sgs@163.com",
      status: 1,
    });

    expect(prismaMock.sequenceCounter.update).toHaveBeenCalledWith({
      where: { counterName: "SANGUOSHA_ACCOUNT" },
      data: { currentValue: { increment: 1 } },
    });
    expect(prismaMock.sanguoshaAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        serialNumber: "#SGS-11",
        email: "sgs@163.com",
      }),
    });
    expect(prismaMock.codmAccount.create).not.toHaveBeenCalled();
    expect(account).toMatchObject({
      gameKey: "sanguosha",
      serialNumber: "#SGS-11",
    });
  });

  it("创建账号缺少序号计数器时返回带游戏名称的错误", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);
    prismaMock.sanguoshaEmail.findFirst.mockResolvedValue(
      emailRecord({ id: 9n, prefix: "sgs", postfix: "@163.com" }),
    );
    prismaMock.sanguoshaAccount.findFirst.mockResolvedValue(null);
    prismaMock.sequenceCounter.update.mockRejectedValue(new Error("missing"));

    await expect(
      createAdminAccount({
        gameKey: "sanguosha",
        serialNumber: undefined,
        images: ["https://cdn.example.com/sgs.jpg"],
        attributes: {},
        price: 199,
        costPrice: 120,
        title: "三国杀账号",
        description: "测试描述",
        xianyuUrl: undefined,
        email: "sgs@163.com",
        status: 1,
      }),
    ).rejects.toMatchObject({
      code: "COUNTER_NOT_FOUND",
      message:
        "三国杀账号序号计数器 SANGUOSHA_ACCOUNT 不存在，请先初始化该计数器",
    });
    expect(prismaMock.sanguoshaAccount.create).not.toHaveBeenCalled();
  });

  it("拒绝无效的账号属性值", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        attrKey: "mythic_skins",
        label: "神话皮肤",
      }),
      attributeDefinitionRecord({
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: null,
        options: [{ label: "传奇战神", value: "legendary" }],
        sortOrder: 1,
      }),
    ]);

    await expect(
      createAdminAccount({
        serialNumber: undefined,
        images: ["https://cdn.example.com/account.jpg"],
        attributes: { mythic_skins: -1, rank: "invalid" },
        price: 199,
        costPrice: 120,
        title: "满级账号",
        description: "测试描述",
        xianyuUrl: undefined,
        email: undefined,
        status: 2,
      }),
    ).rejects.toMatchObject({ code: "BAD_ACCOUNT_ATTRIBUTE" });
    expect(prismaMock.codmAccount.create).not.toHaveBeenCalled();
  });

  it("邮箱已被其他上架账号绑定时拒绝上架账号", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        status: 2,
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue({
      serialNumber: "#CODM-8",
    });

    await expect(updateAdminAccountStatus(7, 1)).rejects.toMatchObject({
      code: "EMAIL_BOUND",
    });
    expect(prismaMock.codmAccount.update).not.toHaveBeenCalled();
  });

  it("编辑账号时保留未变化的已停用历史属性值", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        attributes: { rank: "legendary" },
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        attrKey: "mythic_skins",
        label: "神话皮肤",
      }),
      attributeDefinitionRecord({
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: null,
        options: [{ label: "青铜", value: "bronze" }],
        enabled: false,
        sortOrder: 1,
      }),
    ]);
    prismaMock.codmAccount.update.mockResolvedValue(
      accountRecord({
        attributes: { rank: "legendary" },
        costPrice: 88,
      }),
    );

    const account = await updateAdminAccount(7, {
      attributes: { rank: "legendary" },
      costPrice: 88,
      email: undefined,
      serialNumber: undefined,
      xianyuUrl: undefined,
    });

    expect(prismaMock.codmAccount.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        attributes: { rank: "legendary" },
        costPrice: 88,
      }),
    });
    expect(account.costPrice).toBe(88);
    expect(account.attributeValues).toMatchObject([
      {
        key: "rank",
        enabled: false,
        displayValue: "legendary",
      },
    ]);
  });

  it("编辑账号清空属性时移除已停用历史属性值", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        attributes: { rank: "legendary" },
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([
      attributeDefinitionRecord({
        attrKey: "rank",
        label: "段位",
        type: "select",
        unit: null,
        options: [{ label: "青铜", value: "bronze" }],
        enabled: false,
      }),
    ]);
    prismaMock.codmAccount.update.mockResolvedValue(accountRecord());

    await updateAdminAccount(7, {
      attributes: {},
      email: undefined,
      serialNumber: undefined,
      xianyuUrl: undefined,
    });

    expect(prismaMock.codmAccount.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        attributes: {},
      }),
    });
  });

  it("编辑账号时，如果账号当前没有绑定邮箱，应返回业务错误", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({ email: null, status: 2 }),
    );
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    await expect(
      updateAdminAccount(7, {
        email: undefined,
        serialNumber: undefined,
        title: "新的标题",
        xianyuUrl: undefined,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_REQUIRED" });
    expect(prismaMock.codmAccount.update).not.toHaveBeenCalled();
  });

  it("编辑账号更换邮箱成功后，会释放原邮箱并绑定新邮箱", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        status: 2,
      }),
    );
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({
        id: 4n,
        prefix: "new",
        postfix: "@example.com",
        bindStatus: 2,
      }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.codmAccount.update.mockResolvedValue(
      accountRecord({
        email: "new@example.com",
        status: 2,
      }),
    );

    await updateAdminAccount(7, {
      email: "new@example.com",
      serialNumber: undefined,
      xianyuUrl: undefined,
    });

    expect(prismaMock.codmEmail.updateMany).toHaveBeenCalledWith({
      where: {
        prefix: "buyer",
        postfix: "@example.com",
        NOT: { bindStatus: 2 },
      },
      data: { bindStatus: 2 },
    });
    expect(prismaMock.codmEmail.update).toHaveBeenCalledWith({
      where: { id: 4n },
      data: { bindStatus: 1 },
    });
  });

  it("下架账号时，只改变账号可见性，不会解绑邮箱", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        status: 1,
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);
    prismaMock.codmAccount.update.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        status: 2,
      }),
    );
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    await updateAdminAccountStatus(7, 2);

    expect(prismaMock.codmAccount.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: 2 },
    });
    expect(prismaMock.codmEmail.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { bindStatus: 2 },
      }),
    );
  });

  it("出售账号会将账号标记为已出售，并释放邮箱为未绑定状态", async () => {
    const beforeSell = new Date("2026-07-08T09:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(beforeSell);
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        costPrice: 50,
        email: "buyer@example.com",
        price: 99,
        status: 1,
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );
    prismaMock.codmAccount.update.mockResolvedValue(
      accountRecord({
        costPrice: 50,
        email: null,
        soldAt: beforeSell,
        soldPrice: 88,
        status: 3,
      }),
    );
    prismaMock.codmEmail.update.mockResolvedValue(
      emailRecord({ bindStatus: 2 }),
    );
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    const account = await sellAdminAccount(7, { soldPrice: 88 });

    expect(prismaMock.codmAccount.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        email: null,
        soldAt: beforeSell,
        soldPrice: 88,
        status: 3,
      },
    });
    expect(prismaMock.codmEmail.update).toHaveBeenCalledWith({
      where: { id: 3n },
      data: { bindStatus: 2 },
    });
    expect(account).toMatchObject({
      email: "",
      profit: 38,
      soldPrice: 88,
      status: 3,
    });
    vi.useRealTimers();
  });

  it("出售操作不可逆，已出售账号不能再次出售", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: null,
        status: 3,
      }),
    );

    await expect(sellAdminAccount(7, { soldPrice: 88 })).rejects.toMatchObject({
      code: "ACCOUNT_SOLD",
    });
    expect(prismaMock.codmAccount.update).not.toHaveBeenCalled();
  });

  it("出售账号时，如果账号没有绑定邮箱，应返回业务错误", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: null,
        status: 1,
      }),
    );

    await expect(sellAdminAccount(7, { soldPrice: 88 })).rejects.toMatchObject({
      code: "EMAIL_REQUIRED",
    });
    expect(prismaMock.codmAccount.update).not.toHaveBeenCalled();
  });

  it("出售账号时，如果邮箱不存在，应返回业务错误", async () => {
    prismaMock.codmAccount.findUnique.mockResolvedValue(
      accountRecord({
        email: "buyer@example.com",
        status: 1,
      }),
    );
    prismaMock.codmEmail.findFirst.mockResolvedValue(null);

    await expect(sellAdminAccount(7, { soldPrice: 88 })).rejects.toMatchObject({
      code: "EMAIL_NOT_FOUND",
    });
    expect(prismaMock.codmAccount.update).not.toHaveBeenCalled();
  });
});

describe("后台邮箱", () => {
  it("按游戏查询邮箱列表并匹配对应游戏的绑定账号", async () => {
    prismaMock.sanguoshaEmail.count.mockResolvedValue(1);
    prismaMock.sanguoshaEmail.findMany.mockResolvedValue([
      emailRecord({ id: 8n, prefix: "sgs", postfix: "@example.com" }),
    ]);
    prismaMock.sanguoshaAccount.findMany.mockResolvedValue([
      { email: "sgs@example.com", id: 61n },
    ]);

    const result = await listAdminEmails({
      game_key: "sanguosha",
      keyword: undefined,
      page: 1,
      limit: 10,
    });

    expect(prismaMock.sanguoshaEmail.count).toHaveBeenCalledWith({
      where: {},
    });
    expect(prismaMock.sanguoshaEmail.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
      skip: 0,
      take: 10,
    });
    expect(prismaMock.sanguoshaAccount.findMany).toHaveBeenCalledWith({
      where: {
        email: { in: ["sgs@example.com"] },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        email: true,
        id: true,
      },
    });
    expect(prismaMock.codmEmail.findMany).not.toHaveBeenCalled();
    expect(result.list[0]).toMatchObject({
      email: "sgs@example.com",
      boundAccountId: 61,
    });
  });

  it("创建邮箱时根据上架账号推导绑定状态", async () => {
    prismaMock.codmEmail.findFirst.mockResolvedValue(null);
    prismaMock.codmAccount.findFirst.mockResolvedValue({ id: 7n });
    prismaMock.codmEmail.create.mockResolvedValue(
      emailRecord({ bindStatus: 1 }),
    );

    const email = await createAdminEmail({
      prefix: "buyer",
      postfix: "@example.com",
      bindStatus: 2,
    });

    expect(prismaMock.codmEmail.create).toHaveBeenCalledWith({
      data: {
        prefix: "buyer",
        postfix: "@example.com",
        bindStatus: 1,
      },
    });
    expect(email).toMatchObject({
      email: "buyer@example.com",
      bindStatus: 1,
    });
  });

  it("拒绝包含 @ 的新邮箱前缀", async () => {
    await expect(
      createAdminEmail({
        prefix: "buyer@example.com",
        postfix: "@example.com",
        bindStatus: 2,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prismaMock.codmEmail.create).not.toHaveBeenCalled();
  });

  it("邮箱已关联账号时拒绝修改邮箱地址", async () => {
    prismaMock.codmEmail.findUnique.mockResolvedValue(emailRecord());
    prismaMock.codmAccount.findFirst.mockResolvedValue({
      id: 7n,
      serialNumber: "#CODM-7",
    });

    await expect(
      updateAdminEmail(3, { postfix: "@new.example.com" }),
    ).rejects.toMatchObject({ code: "EMAIL_LINKED" });
    expect(prismaMock.codmEmail.update).not.toHaveBeenCalled();
  });

  it("邮箱已关联账号时拒绝删除邮箱", async () => {
    prismaMock.codmEmail.findUnique.mockResolvedValue(emailRecord());
    prismaMock.codmAccount.findFirst.mockResolvedValue({
      id: 7n,
      serialNumber: "#CODM-7",
    });

    await expect(deleteAdminEmail(3)).rejects.toMatchObject({
      code: "EMAIL_LINKED",
    });
    expect(prismaMock.codmEmail.delete).not.toHaveBeenCalled();
  });

  it("手动绑定状态与账号使用情况冲突时拒绝更新", async () => {
    prismaMock.codmEmail.findUnique.mockResolvedValue(emailRecord());
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);

    await expect(updateAdminEmailBindStatus(3, 1)).rejects.toMatchObject({
      code: "EMAIL_BIND_STATUS_CONFLICT",
    });
    expect(prismaMock.codmEmail.update).not.toHaveBeenCalled();
  });
});

describe("后台邮箱后缀", () => {
  it("列出全局邮箱后缀并统计所有游戏的使用数量", async () => {
    prismaMock.gameEmailPostfix.findMany.mockResolvedValue([
      emailPostfixRecord({ id: 1n, postfix: "@163.com" }),
      emailPostfixRecord({
        id: 2n,
        postfix: "@gmail.com",
        enabled: false,
        sortOrder: 1,
      }),
    ]);
    prismaMock.codmEmail.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(0);
    prismaMock.sanguoshaEmail.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);

    const postfixes = await listAdminEmailPostfixes();

    expect(prismaMock.gameEmailPostfix.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    expect(prismaMock.codmEmail.count).toHaveBeenNthCalledWith(1, {
      where: { postfix: "@163.com" },
    });
    expect(prismaMock.sanguoshaEmail.count).toHaveBeenNthCalledWith(1, {
      where: { postfix: "@163.com" },
    });
    expect(prismaMock.codmEmail.count).toHaveBeenNthCalledWith(2, {
      where: { postfix: "@gmail.com" },
    });
    expect(prismaMock.sanguoshaEmail.count).toHaveBeenNthCalledWith(2, {
      where: { postfix: "@gmail.com" },
    });
    expect(postfixes).toMatchObject([
      {
        postfix: "@163.com",
        enabled: true,
        usageCount: 13,
      },
      {
        postfix: "@gmail.com",
        enabled: false,
        usageCount: 0,
      },
    ]);
  });

  it("创建邮箱后缀时规范化 @ 前缀并拒绝重复", async () => {
    prismaMock.gameEmailPostfix.findUnique.mockResolvedValue(null);
    prismaMock.gameEmailPostfix.create.mockResolvedValue(
      emailPostfixRecord({ postfix: "@163.com", sortOrder: 3 }),
    );
    prismaMock.codmEmail.count.mockResolvedValue(0);

    const postfix = await createAdminEmailPostfix({
      postfix: "163.com",
      enabled: true,
      sortOrder: 3,
    });

    expect(prismaMock.gameEmailPostfix.findUnique).toHaveBeenCalledWith({
      where: {
        postfix: "@163.com",
      },
    });
    expect(prismaMock.gameEmailPostfix.create).toHaveBeenCalledWith({
      data: {
        gameKey: "global",
        postfix: "@163.com",
        enabled: true,
        sortOrder: 3,
      },
    });
    expect(postfix).toMatchObject({
      postfix: "@163.com",
      usageCount: 0,
    });
  });

  it("创建重复邮箱后缀时报错", async () => {
    prismaMock.gameEmailPostfix.findUnique.mockResolvedValue(
      emailPostfixRecord(),
    );

    await expect(
      createAdminEmailPostfix({
        postfix: "@163.com",
        enabled: true,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_EMAIL_POSTFIX" });
    expect(prismaMock.gameEmailPostfix.create).not.toHaveBeenCalled();
  });

  it("更新邮箱后缀时可以停用已使用的后缀", async () => {
    prismaMock.gameEmailPostfix.findUnique.mockResolvedValue(
      emailPostfixRecord(),
    );
    prismaMock.gameEmailPostfix.update.mockResolvedValue(
      emailPostfixRecord({ enabled: false }),
    );
    prismaMock.codmEmail.count.mockResolvedValue(6);
    prismaMock.sanguoshaEmail.count.mockResolvedValue(2);

    const postfix = await updateAdminEmailPostfix(5, { enabled: false });

    expect(prismaMock.gameEmailPostfix.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { enabled: false },
    });
    expect(postfix).toMatchObject({
      enabled: false,
      usageCount: 8,
    });
  });

  it("邮箱后缀已被邮箱使用时拒绝删除", async () => {
    prismaMock.gameEmailPostfix.findUnique.mockResolvedValue(
      emailPostfixRecord(),
    );
    prismaMock.codmEmail.count.mockResolvedValue(1);
    prismaMock.sanguoshaEmail.count.mockResolvedValue(0);

    await expect(deleteAdminEmailPostfix(5)).rejects.toMatchObject({
      code: "EMAIL_POSTFIX_IN_USE",
      status: 409,
    });
    expect(prismaMock.gameEmailPostfix.delete).not.toHaveBeenCalled();
  });

  it("删除未被使用的邮箱后缀", async () => {
    prismaMock.gameEmailPostfix.findUnique.mockResolvedValue(
      emailPostfixRecord({ postfix: "@gmail.com" }),
    );
    prismaMock.codmEmail.count.mockResolvedValue(0);
    prismaMock.sanguoshaEmail.count.mockResolvedValue(0);

    await deleteAdminEmailPostfix(5);

    expect(prismaMock.gameEmailPostfix.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
  });
});

describe("后台序号计数器", () => {
  it("列出计数器时带出游戏和用途说明", async () => {
    prismaMock.sequenceCounter.findMany.mockResolvedValue([
      sequenceCounterRecord({
        id: 1n,
        counterName: "CODM_ACCOUNT",
        currentValue: 42n,
      }),
      sequenceCounterRecord({
        id: 2n,
        counterName: "SANGUOSHA_ACCOUNT",
        currentValue: 11n,
      }),
      sequenceCounterRecord({
        id: 3n,
        counterName: "CUSTOM_COUNTER",
        currentValue: 3n,
      }),
    ]);

    const counters = await listSequenceCounters();

    expect(counters).toMatchObject([
      {
        counterName: "CODM_ACCOUNT",
        currentValue: 42,
        gameKey: "codm",
        gameLabel: "CODM",
        purpose: "账号编号",
        displayName: "CODM 账号编号",
      },
      {
        counterName: "SANGUOSHA_ACCOUNT",
        currentValue: 11,
        gameKey: "sanguosha",
        gameLabel: "三国杀",
        purpose: "账号编号",
        displayName: "三国杀 账号编号",
      },
      {
        counterName: "CUSTOM_COUNTER",
        currentValue: 3,
        purpose: "自定义",
        displayName: "CUSTOM_COUNTER",
      },
    ]);
  });
});
