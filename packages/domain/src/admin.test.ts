import { beforeEach, describe, expect, it, vi } from "vitest";

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
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
    gameAttributeDefinition: {
      create: vi.fn(),
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
  createAdminGameAttributeDefinition,
  deleteAdminEmail,
  deleteAdminGameAttributeDefinition,
  listAdminGameAttributeDefinitions,
  updateAdminAccount,
  updateAdminAccountStatus,
  updateAdminEmail,
  updateAdminEmailBindStatus,
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
    title: string;
    describe: string | null;
    xianyuUrl: string | null;
    email: string | null;
    status: number;
  }> = {},
) {
  return {
    id: 7n,
    serialNumber: "#CODM-7",
    images: [],
    attributes: {},
    price: 99,
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
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (callback) =>
    callback(prismaMock),
  );
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
    expect(prismaMock.gameAttributeDefinition.findUnique).not.toHaveBeenCalled();
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
    prismaMock.codmAccount.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 7n });
    prismaMock.sequenceCounter.update.mockResolvedValue(
      sequenceCounterRecord({ currentValue: 42n }),
    );
    prismaMock.codmAccount.findUnique.mockResolvedValue(null);
    prismaMock.codmAccount.create.mockResolvedValue(
      accountRecord({
        serialNumber: "#CODM-42",
        attributes: { mythic_skins: 3, rank: "legendary" },
        email: "buyer@example.com",
        status: 1,
      }),
    );

    const account = await createAdminAccount({
      serialNumber: undefined,
      images: ["https://cdn.example.com/account.jpg"],
      attributes: { mythic_skins: "3", rank: "legendary" },
      price: 199,
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
        email: "buyer@example.com",
        status: 1,
      }),
    });
    expect(prismaMock.codmEmail.updateMany).toHaveBeenCalledWith({
      where: {
        prefix: "buyer",
        postfix: "@example.com",
        NOT: { bindStatus: 1 },
      },
      data: { bindStatus: 1 },
    });
    expect(account).toMatchObject({
      serialNumber: "#CODM-42",
      attributes: { mythic_skins: 3, rank: "legendary" },
    });
  });

  it("拒绝创建未绑定邮箱的上架账号", async () => {
    prismaMock.gameAttributeDefinition.findMany.mockResolvedValue([]);

    await expect(
      createAdminAccount({
        serialNumber: undefined,
        images: ["https://cdn.example.com/account.jpg"],
        attributes: {},
        price: 199,
        title: "满级账号",
        description: "测试描述",
        xianyuUrl: undefined,
        email: undefined,
        status: 1,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_REQUIRED" });
    expect(prismaMock.codmAccount.create).not.toHaveBeenCalled();
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
        attributes: { rank: "legendary" },
      }),
    );
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
      }),
    );

    const account = await updateAdminAccount(7, {
      attributes: { rank: "legendary" },
      email: undefined,
      serialNumber: undefined,
      xianyuUrl: undefined,
    });

    expect(prismaMock.codmAccount.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        attributes: { rank: "legendary" },
      }),
    });
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
        attributes: { rank: "legendary" },
      }),
    );
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
});

describe("后台邮箱", () => {
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
