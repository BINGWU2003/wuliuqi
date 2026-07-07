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

describe("admin game attribute definitions", () => {
  it("lists non-deleted definitions with usage counts", async () => {
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

  it("rejects duplicate attribute keys on create", async () => {
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

  it("rejects select attributes without options", async () => {
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

  it("drops options when creating a number attribute", async () => {
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

  it("rejects identity changes when an attribute is in use", async () => {
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

  it("rejects soft delete when an attribute is in use", async () => {
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

  it("soft deletes unused attributes", async () => {
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

  it("clears stored account values for an attribute", async () => {
    prismaMock.gameAttributeDefinition.findFirst.mockResolvedValue(
      attributeDefinitionRecord(),
    );
    prismaMock.$executeRaw.mockResolvedValue(23);

    const result = await clearAdminGameAttributeDefinitionValues(1);

    expect(result).toEqual({ clearedCount: 23 });
    expect(prismaMock.$executeRaw).toHaveBeenCalledOnce();
  });
});

describe("admin account attributes", () => {
  it("creates listed accounts with generated serials and syncs email bind status", async () => {
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

  it("rejects listed accounts without email", async () => {
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

  it("rejects invalid account attribute values", async () => {
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

  it("rejects listing an account when its email is bound to another listed account", async () => {
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

  it("keeps unchanged disabled historical attributes while editing account", async () => {
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

  it("removes disabled historical attributes when they are cleared", async () => {
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

describe("admin emails", () => {
  it("creates emails with bind status derived from listed accounts", async () => {
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

  it("rejects new email prefixes containing at signs", async () => {
    await expect(
      createAdminEmail({
        prefix: "buyer@example.com",
        postfix: "@example.com",
        bindStatus: 2,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prismaMock.codmEmail.create).not.toHaveBeenCalled();
  });

  it("rejects changing an email address while it is linked to an account", async () => {
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

  it("rejects deleting an email while it is linked to an account", async () => {
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

  it("rejects manual bind status that conflicts with account usage", async () => {
    prismaMock.codmEmail.findUnique.mockResolvedValue(emailRecord());
    prismaMock.codmAccount.findFirst.mockResolvedValue(null);

    await expect(updateAdminEmailBindStatus(3, 1)).rejects.toMatchObject({
      code: "EMAIL_BIND_STATUS_CONFLICT",
    });
    expect(prismaMock.codmEmail.update).not.toHaveBeenCalled();
  });
});
