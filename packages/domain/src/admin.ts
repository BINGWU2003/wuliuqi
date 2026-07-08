import type { Prisma } from "@prisma/client";
import type {
  AccountAttributes,
  AdminAccount,
  AdminAccountListResult,
  AdminEmail,
  AdminEmailListResult,
  Carousel,
  GameAttributeDefinition,
  GameAttributeOption,
  SequenceCounter,
} from "@wuliuqi/types";
import type {
  AdminAccountCreateInput,
  AdminAccountListQuery,
  AdminAccountUpdateInput,
  AdminEmailCreateInput,
  AdminEmailListQuery,
  AdminEmailUpdateInput,
  CarouselUpdateInput,
  GameAttributeDefinitionCreateInput,
  GameAttributeDefinitionUpdateInput,
  SequenceCounterCreateInput,
} from "@wuliuqi/validators";
import { prisma } from "@wuliuqi/db";
import {
  normalizeAccountAttributes,
  serializeAccount,
  serializeCarousel,
  serializeEmail,
  serializeGameAttributeDefinition,
  serializeSequenceCounter,
} from "./serializers";

type TransactionClient = Prisma.TransactionClient;
type AccountLookupClient = Pick<TransactionClient, "codmAccount">;
type AttributeDefinitionClient = Pick<
  TransactionClient,
  "gameAttributeDefinition"
>;
type RawQueryClient = Pick<TransactionClient, "$executeRaw" | "$queryRaw">;
type LinkedEmailAccount = {
  id: bigint;
  serialNumber: string;
};
type EmailRecord = {
  id: bigint;
  prefix: string;
  postfix: string;
  bindStatus: number;
};

const CODM_GAME_KEY = "codm";
const ACCOUNT_SOLD_STATUS = 3;
const EMAIL_BOUND_STATUS = 1;
const EMAIL_UNBOUND_STATUS = 2;

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

function parseEmailAddress(
  email?: string | null,
): { prefix: string; postfix: string } | null {
  if (!email) {
    return null;
  }

  const separatorIndex = email.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === email.length - 1) {
    return null;
  }

  const prefix = email.slice(0, separatorIndex);
  const postfix = email.slice(separatorIndex + 1);

  return { prefix, postfix: `@${postfix}` };
}

function assertValidOptionalUrl(url?: string): void {
  if (!url) {
    return;
  }

  try {
    new URL(url);
  } catch {
    throw new DomainError("BAD_REQUEST", "无效的闲鱼链接格式");
  }
}

function composeEmailAddress(prefix: string, postfix: string): string {
  return `${prefix}${postfix}`;
}

function normalizeDefinitionOptions(
  definition: Pick<GameAttributeDefinitionCreateInput, "options" | "type">,
): GameAttributeOption[] {
  if (definition.type === "number") {
    return [];
  }

  return definition.options;
}

function assertSelectOptions(options: GameAttributeOption[]) {
  if (options.length === 0) {
    throw new DomainError("BAD_REQUEST", "下拉属性至少需要一个选项");
  }
}

async function listAttributeDefinitionsForGame(
  client: AttributeDefinitionClient,
  gameKey = CODM_GAME_KEY,
  enabledOnly = false,
): Promise<GameAttributeDefinition[]> {
  const definitions = await client.gameAttributeDefinition.findMany({
    where: {
      gameKey,
      deletedAt: null,
      ...(enabledOnly ? { enabled: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return definitions.map(serializeGameAttributeDefinition);
}

function hasAccountAttributeValue(
  attributes: AccountAttributes,
  attrKey: string,
) {
  const value = attributes[attrKey];

  return value !== undefined && value !== "";
}

async function listAttributeDefinitionsForAccountUpdate(
  client: AttributeDefinitionClient,
  existingAttributes: AccountAttributes,
) {
  const definitions = await listAttributeDefinitionsForGame(
    client,
    CODM_GAME_KEY,
  );

  return definitions.filter(
    (definition) =>
      definition.enabled ||
      hasAccountAttributeValue(existingAttributes, definition.attrKey),
  );
}

async function countGameAttributeUsage(
  client: Pick<RawQueryClient, "$queryRaw">,
  attrKey: string,
) {
  const [row] = await client.$queryRaw<Array<{ usageCount: bigint }>>`
    SELECT count(*)::bigint AS "usageCount"
    FROM "codm_accounts"
    WHERE "attributes" ? ${attrKey}
      AND "attributes" ->> ${attrKey} <> ''
  `;

  return Number(row?.usageCount ?? 0);
}

async function listGameAttributeUsageCounts(gameKey: string) {
  const rows = await prisma.$queryRaw<
    Array<{ id: bigint; usageCount: bigint }>
  >`
    SELECT
      definitions."id",
      count(accounts."id")::bigint AS "usageCount"
    FROM "game_attribute_definitions" definitions
    LEFT JOIN "codm_accounts" accounts
      ON accounts."attributes" ? definitions."attr_key"
      AND accounts."attributes" ->> definitions."attr_key" <> ''
    WHERE definitions."game_key" = ${gameKey}
      AND definitions."deleted_at" IS NULL
    GROUP BY definitions."id"
  `;

  return new Map(
    rows.map((row) => [row.id.toString(), Number(row.usageCount)]),
  );
}

function normalizeAccountAttributesForWrite(
  attributes: AccountAttributes | undefined,
  definitions: GameAttributeDefinition[],
  existingAttributes?: AccountAttributes,
): AccountAttributes {
  if (!attributes) {
    return {};
  }

  const nextAttributes: AccountAttributes = {};

  for (const definition of definitions) {
    const value = attributes[definition.attrKey];

    if (value === undefined || value === "") {
      continue;
    }

    if (definition.type === "number") {
      const numberValue =
        typeof value === "number" ? value : Number(String(value).trim());

      if (!Number.isInteger(numberValue) || numberValue < 0) {
        throw new DomainError(
          "BAD_ACCOUNT_ATTRIBUTE",
          `${definition.label}必须是非负整数`,
        );
      }

      nextAttributes[definition.attrKey] = numberValue;
      continue;
    }

    const stringValue = String(value);
    const existingValue = existingAttributes?.[definition.attrKey];
    const isUnchangedDisabledValue =
      !definition.enabled && existingValue === stringValue;

    if (
      !isUnchangedDisabledValue &&
      !definition.options.some((option) => option.value === stringValue)
    ) {
      throw new DomainError(
        "BAD_ACCOUNT_ATTRIBUTE",
        `${definition.label}选项无效`,
      );
    }

    nextAttributes[definition.attrKey] = stringValue;
  }

  return nextAttributes;
}

function assertNewEmailPrefix(prefix: string): void {
  if (prefix.includes("@")) {
    throw new DomainError("BAD_REQUEST", "邮箱前缀不能包含 @");
  }
}

function assertEmailPrefixMutation(
  existingPrefix: string,
  nextPrefix: string,
): void {
  if (nextPrefix.includes("@") && nextPrefix !== existingPrefix) {
    throw new DomainError("BAD_REQUEST", "邮箱前缀不能包含 @");
  }
}

async function getExpectedEmailBindStatus(
  tx: TransactionClient,
  email?: string | null,
): Promise<1 | 2> {
  if (!email) {
    return EMAIL_UNBOUND_STATUS;
  }

  const activeAccount = await tx.codmAccount.findFirst({
    where: {
      email,
      status: { not: ACCOUNT_SOLD_STATUS },
    },
    select: { id: true },
  });

  return activeAccount ? EMAIL_BOUND_STATUS : EMAIL_UNBOUND_STATUS;
}

async function findLinkedAccountByEmail(
  client: AccountLookupClient,
  email?: string | null,
): Promise<LinkedEmailAccount | null> {
  if (!email) {
    return null;
  }

  return client.codmAccount.findFirst({
    where: {
      email,
      status: { not: ACCOUNT_SOLD_STATUS },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      serialNumber: true,
    },
  });
}

async function assertEmailAddressNotLinked(
  tx: TransactionClient,
  email: string,
  action: string,
) {
  const linkedAccount = await findLinkedAccountByEmail(tx, email);

  if (linkedAccount) {
    throw new DomainError(
      "EMAIL_LINKED",
      `该邮箱已关联账号 ${linkedAccount.serialNumber}，无法${action}`,
    );
  }
}

async function syncEmailBindStatusFromAccounts(
  tx: TransactionClient,
  email?: string | null,
) {
  const parts = parseEmailAddress(email);

  if (!parts) {
    return;
  }

  const bindStatus = await getExpectedEmailBindStatus(tx, email);

  await tx.codmEmail.updateMany({
    where: {
      prefix: parts.prefix,
      postfix: parts.postfix,
      NOT: { bindStatus },
    },
    data: { bindStatus },
  });
}

async function assertListedAccountCanUseEmail(
  tx: TransactionClient,
  email?: string | null,
  currentAccountId?: number,
) {
  if (!email) {
    throw new DomainError("EMAIL_REQUIRED", "账号必须绑定邮箱");
  }

  const boundAccount = await tx.codmAccount.findFirst({
    where: {
      email,
      status: { not: ACCOUNT_SOLD_STATUS },
      ...(currentAccountId === undefined
        ? {}
        : { NOT: { id: currentAccountId } }),
    },
    select: {
      serialNumber: true,
    },
  });

  if (boundAccount) {
    throw new DomainError(
      "EMAIL_BOUND",
      `该邮箱已被账号 ${boundAccount.serialNumber} 绑定，无法使用`,
    );
  }
}

async function getEmailRecordByAddress(
  tx: TransactionClient,
  email: string,
): Promise<EmailRecord> {
  const parts = parseEmailAddress(email);

  if (!parts) {
    throw new DomainError("BAD_REQUEST", "邮箱格式无效");
  }

  const emailRecord = await tx.codmEmail.findFirst({
    where: {
      prefix: parts.prefix,
      postfix: parts.postfix,
    },
    select: {
      id: true,
      prefix: true,
      postfix: true,
      bindStatus: true,
    },
  });

  if (!emailRecord) {
    throw new DomainError("EMAIL_NOT_FOUND", "绑定邮箱不存在");
  }

  return emailRecord;
}

async function assertAccountEmailForWrite(
  tx: TransactionClient,
  email?: string | null,
  currentAccountId?: number,
): Promise<EmailRecord> {
  if (!email) {
    throw new DomainError("EMAIL_REQUIRED", "账号必须绑定邮箱");
  }

  const emailRecord = await getEmailRecordByAddress(tx, email);

  await assertListedAccountCanUseEmail(tx, email, currentAccountId);

  return emailRecord;
}

async function markEmailBindStatus(
  tx: TransactionClient,
  emailRecord: Pick<EmailRecord, "id">,
  bindStatus: 1 | 2,
) {
  await tx.codmEmail.update({
    where: { id: emailRecord.id },
    data: { bindStatus },
  });
}

async function releaseEmailBindStatus(
  tx: TransactionClient,
  email?: string | null,
) {
  const parts = parseEmailAddress(email);

  if (!parts) {
    return;
  }

  await tx.codmEmail.updateMany({
    where: {
      prefix: parts.prefix,
      postfix: parts.postfix,
      NOT: { bindStatus: EMAIL_UNBOUND_STATUS },
    },
    data: { bindStatus: EMAIL_UNBOUND_STATUS },
  });
}

async function getNextCounterValue(tx: TransactionClient, counterName: string) {
  try {
    const counter = await tx.sequenceCounter.update({
      where: { counterName },
      data: { currentValue: { increment: 1 } },
    });

    return counter.currentValue;
  } catch {
    throw new DomainError(
      "COUNTER_NOT_FOUND",
      `计数器 ${counterName} 不存在`,
      404,
    );
  }
}

function accountWriteData(
  input: AdminAccountUpdateInput,
  attributes?: AccountAttributes,
) {
  return {
    serialNumber: input.serialNumber,
    images: input.images,
    attributes,
    price: input.price,
    title: input.title,
    describe: input.description,
    xianyuUrl: input.xianyuUrl,
    email: input.email,
    status: input.status,
  };
}

export async function listAdminAccounts(
  query: AdminAccountListQuery,
): Promise<AdminAccountListResult> {
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
      { describe: { contains: query.keyword } },
      { email: { contains: query.keyword } },
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
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    listAttributeDefinitionsForGame(prisma, CODM_GAME_KEY),
  ]);

  return {
    list: accounts.map((account) =>
      serializeAccount(account, attributeDefinitions),
    ),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    keyword: query.keyword,
    priceRange:
      query.min_price !== undefined || query.max_price !== undefined
        ? { minPrice: query.min_price, maxPrice: query.max_price }
        : undefined,
  };
}

export async function getAdminAccountById(
  id: number,
): Promise<AdminAccount | null> {
  const [account, attributeDefinitions] = await Promise.all([
    prisma.codmAccount.findUnique({ where: { id } }),
    listAttributeDefinitionsForGame(prisma, CODM_GAME_KEY),
  ]);

  return account ? serializeAccount(account, attributeDefinitions) : null;
}

export async function createAdminAccount(
  input: AdminAccountCreateInput,
): Promise<AdminAccount> {
  assertValidOptionalUrl(input.xianyuUrl);

  return prisma.$transaction(async (tx) => {
    const attributeDefinitions = await listAttributeDefinitionsForGame(
      tx,
      CODM_GAME_KEY,
      true,
    );
    const attributes = normalizeAccountAttributesForWrite(
      input.attributes,
      attributeDefinitions,
    );

    const emailRecord = await assertAccountEmailForWrite(tx, input.email);

    const serialNumber =
      input.serialNumber ??
      `#CODM-${String(await getNextCounterValue(tx, "CODM_ACCOUNT"))}`;

    const existingAccount = await tx.codmAccount.findUnique({
      where: { serialNumber },
    });

    if (existingAccount) {
      throw new DomainError("DUPLICATE_SERIAL", "该序列号已存在");
    }

    const account = await tx.codmAccount.create({
      data: {
        serialNumber,
        images: input.images,
        attributes,
        price: input.price,
        title: input.title,
        describe: input.description,
        xianyuUrl: input.xianyuUrl,
        email: input.email,
        status: input.status,
      },
    });

    await markEmailBindStatus(tx, emailRecord, EMAIL_BOUND_STATUS);

    return serializeAccount(account, attributeDefinitions);
  });
}

export async function updateAdminAccount(
  id: number,
  input: AdminAccountUpdateInput,
): Promise<AdminAccount> {
  assertValidOptionalUrl(input.xianyuUrl);

  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.codmAccount.findUnique({ where: { id } });

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "CODM账号未找到", 404);
    }

    if (existingAccount.status === ACCOUNT_SOLD_STATUS) {
      throw new DomainError("ACCOUNT_SOLD", "已出售账号不可编辑", 409);
    }

    const existingAttributes = normalizeAccountAttributes(
      existingAccount.attributes,
    );
    const attributeDefinitions = await listAttributeDefinitionsForAccountUpdate(
      tx,
      existingAttributes,
    );

    if (
      input.serialNumber &&
      input.serialNumber !== existingAccount.serialNumber
    ) {
      const serialAccount = await tx.codmAccount.findUnique({
        where: { serialNumber: input.serialNumber },
      });

      if (serialAccount && serialAccount.id !== existingAccount.id) {
        throw new DomainError("DUPLICATE_SERIAL", "该序列号已被其他账号使用");
      }
    }

    const nextEmail =
      input.email !== undefined ? input.email : existingAccount.email;
    const emailChanged = nextEmail !== existingAccount.email;

    const nextEmailRecord = await assertAccountEmailForWrite(tx, nextEmail, id);

    const attributes =
      input.attributes === undefined
        ? undefined
        : normalizeAccountAttributesForWrite(
            input.attributes,
            attributeDefinitions,
            existingAttributes,
          );

    const account = await tx.codmAccount.update({
      where: { id },
      data: accountWriteData(input, attributes),
    });

    if (emailChanged) {
      await releaseEmailBindStatus(tx, existingAccount.email);
      await markEmailBindStatus(tx, nextEmailRecord, EMAIL_BOUND_STATUS);
    }

    return serializeAccount(account, attributeDefinitions);
  });
}

export async function deleteAdminAccount(id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.codmAccount.findUnique({ where: { id } });

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "CODM账号未找到", 404);
    }

    await tx.codmAccount.delete({ where: { id } });
    await syncEmailBindStatusFromAccounts(tx, existingAccount.email);
  });
}

export async function updateAdminAccountStatus(
  id: number,
  status: 1 | 2,
): Promise<AdminAccount> {
  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.codmAccount.findUnique({ where: { id } });

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "CODM账号未找到", 404);
    }

    if (existingAccount.status === ACCOUNT_SOLD_STATUS) {
      throw new DomainError(
        "ACCOUNT_SOLD",
        "已出售账号不可变更上下架状态",
        409,
      );
    }

    await assertAccountEmailForWrite(tx, existingAccount.email, id);

    const account = await tx.codmAccount.update({
      where: { id },
      data: { status },
    });

    const attributeDefinitions = await listAttributeDefinitionsForGame(
      tx,
      CODM_GAME_KEY,
    );

    return serializeAccount(account, attributeDefinitions);
  });
}

export async function sellAdminAccount(id: number): Promise<AdminAccount> {
  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.codmAccount.findUnique({ where: { id } });

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "CODM账号未找到", 404);
    }

    if (existingAccount.status === ACCOUNT_SOLD_STATUS) {
      throw new DomainError("ACCOUNT_SOLD", "账号已出售，不能重复出售", 409);
    }

    if (!existingAccount.email) {
      throw new DomainError("EMAIL_REQUIRED", "出售前账号必须绑定邮箱");
    }

    const emailRecord = await getEmailRecordByAddress(
      tx,
      existingAccount.email,
    );

    const account = await tx.codmAccount.update({
      where: { id },
      data: {
        email: null,
        status: ACCOUNT_SOLD_STATUS,
      },
    });

    await markEmailBindStatus(tx, emailRecord, EMAIL_UNBOUND_STATUS);

    const attributeDefinitions = await listAttributeDefinitionsForGame(
      tx,
      CODM_GAME_KEY,
    );

    return serializeAccount(account, attributeDefinitions);
  });
}

export async function listAdminEmails(
  query: AdminEmailListQuery,
): Promise<AdminEmailListResult> {
  const where: Prisma.CodmEmailWhereInput = {};

  if (query.bind_status !== undefined) {
    where.bindStatus = query.bind_status;
  }

  if (query.keyword) {
    where.OR = [
      { prefix: { contains: query.keyword } },
      { postfix: { contains: query.keyword } },
    ];
  }

  const total = await prisma.codmEmail.count({ where });
  const emails = await prisma.codmEmail.findMany({
    where,
    orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
  const emailAddresses = emails.map(
    (email) => `${email.prefix}${email.postfix}`,
  );
  const boundAccounts =
    emailAddresses.length > 0
      ? await prisma.codmAccount.findMany({
          where: {
            email: { in: emailAddresses },
          },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          select: {
            email: true,
            id: true,
          },
        })
      : [];
  const accountIdByEmail = new Map<string, bigint>();

  for (const account of boundAccounts) {
    if (account.email && !accountIdByEmail.has(account.email)) {
      accountIdByEmail.set(account.email, account.id);
    }
  }

  return {
    list: emails.map((email) =>
      serializeEmail({
        ...email,
        boundAccountId: accountIdByEmail.get(`${email.prefix}${email.postfix}`),
      }),
    ),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    keyword: query.keyword,
  };
}

export async function getAdminEmailById(
  id: number,
): Promise<AdminEmail | null> {
  const email = await prisma.codmEmail.findUnique({ where: { id } });

  if (!email) {
    return null;
  }

  const linkedAccount = await findLinkedAccountByEmail(
    prisma,
    composeEmailAddress(email.prefix, email.postfix),
  );

  return serializeEmail({
    ...email,
    boundAccountId: linkedAccount?.id,
  });
}

export async function createAdminEmail(
  input: AdminEmailCreateInput,
): Promise<AdminEmail> {
  assertNewEmailPrefix(input.prefix);

  return prisma.$transaction(async (tx) => {
    const existingEmail = await tx.codmEmail.findFirst({
      where: { prefix: input.prefix, postfix: input.postfix },
    });

    if (existingEmail) {
      throw new DomainError("DUPLICATE_EMAIL", "该邮箱已存在");
    }

    const bindStatus = await getExpectedEmailBindStatus(
      tx,
      composeEmailAddress(input.prefix, input.postfix),
    );
    const email = await tx.codmEmail.create({
      data: {
        prefix: input.prefix,
        postfix: input.postfix,
        bindStatus,
      },
    });

    return serializeEmail(email);
  });
}

export async function updateAdminEmail(
  id: number,
  input: AdminEmailUpdateInput,
): Promise<AdminEmail> {
  return prisma.$transaction(async (tx) => {
    const existingEmail = await tx.codmEmail.findUnique({ where: { id } });

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
    }

    const nextPrefix = input.prefix ?? existingEmail.prefix;
    const nextPostfix = input.postfix ?? existingEmail.postfix;
    const existingAddress = composeEmailAddress(
      existingEmail.prefix,
      existingEmail.postfix,
    );
    const nextAddress = composeEmailAddress(nextPrefix, nextPostfix);
    const addressChanged = nextAddress !== existingAddress;

    assertEmailPrefixMutation(existingEmail.prefix, nextPrefix);

    if (addressChanged) {
      await assertEmailAddressNotLinked(tx, existingAddress, "修改邮箱地址");
    }

    if (addressChanged) {
      const conflictEmail = await tx.codmEmail.findFirst({
        where: {
          prefix: nextPrefix,
          postfix: nextPostfix,
          NOT: { id },
        },
      });

      if (conflictEmail) {
        throw new DomainError("DUPLICATE_EMAIL", "该邮箱已被其他记录使用");
      }
    }

    const bindStatus = await getExpectedEmailBindStatus(tx, nextAddress);
    const email = await tx.codmEmail.update({
      where: { id },
      data: {
        prefix: input.prefix,
        postfix: input.postfix,
        bindStatus,
      },
    });

    return serializeEmail(email);
  });
}

export async function deleteAdminEmail(id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingEmail = await tx.codmEmail.findUnique({ where: { id } });

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
    }

    await assertEmailAddressNotLinked(
      tx,
      composeEmailAddress(existingEmail.prefix, existingEmail.postfix),
      "删除",
    );

    await tx.codmEmail.delete({ where: { id } });
  });
}

export async function updateAdminEmailBindStatus(
  id: number,
  bindStatus: 1 | 2,
): Promise<AdminEmail> {
  return prisma.$transaction(async (tx) => {
    const existingEmail = await tx.codmEmail.findUnique({ where: { id } });

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
    }

    const expectedBindStatus = await getExpectedEmailBindStatus(
      tx,
      composeEmailAddress(existingEmail.prefix, existingEmail.postfix),
    );

    if (bindStatus !== expectedBindStatus) {
      throw new DomainError(
        "EMAIL_BIND_STATUS_CONFLICT",
        expectedBindStatus === EMAIL_BOUND_STATUS
          ? "该邮箱仍被上架账号使用，无法标记为未绑定"
          : "该邮箱没有上架账号使用，无法标记为已绑定",
      );
    }

    const email = await tx.codmEmail.update({
      where: { id },
      data: { bindStatus: expectedBindStatus },
    });

    return serializeEmail(email);
  });
}

export async function listAdminGameAttributeDefinitions(
  gameKey = CODM_GAME_KEY,
): Promise<GameAttributeDefinition[]> {
  const [definitions, usageCounts] = await Promise.all([
    prisma.gameAttributeDefinition.findMany({
      where: {
        gameKey,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    listGameAttributeUsageCounts(gameKey),
  ]);

  return definitions.map((definition) =>
    serializeGameAttributeDefinition(
      definition,
      usageCounts.get(definition.id.toString()) ?? 0,
    ),
  );
}

export async function createAdminGameAttributeDefinition(
  input: GameAttributeDefinitionCreateInput,
): Promise<GameAttributeDefinition> {
  const options = normalizeDefinitionOptions(input);

  if (input.type === "select") {
    assertSelectOptions(options);
  }

  const existing = await prisma.gameAttributeDefinition.findUnique({
    where: {
      gameKey_attrKey: {
        gameKey: input.gameKey,
        attrKey: input.attrKey,
      },
    },
  });

  if (existing) {
    throw new DomainError("DUPLICATE_ATTRIBUTE", "该属性标识已存在");
  }

  const definition = await prisma.gameAttributeDefinition.create({
    data: {
      gameKey: input.gameKey,
      attrKey: input.attrKey,
      label: input.label,
      type: input.type,
      unit: input.unit,
      options: options as unknown as Prisma.InputJsonValue,
      enabled: input.enabled,
      sortOrder: input.sortOrder,
    },
  });

  return serializeGameAttributeDefinition(definition);
}

export async function updateAdminGameAttributeDefinition(
  id: number,
  input: GameAttributeDefinitionUpdateInput,
): Promise<GameAttributeDefinition> {
  const existing = await prisma.gameAttributeDefinition.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new DomainError("NOT_FOUND", "属性配置不存在", 404);
  }

  const existingDefinition = serializeGameAttributeDefinition(existing);
  const nextGameKey = input.gameKey ?? existingDefinition.gameKey;
  const nextAttrKey = input.attrKey ?? existingDefinition.attrKey;
  const nextType = input.type ?? existingDefinition.type;
  const nextOptions = normalizeDefinitionOptions({
    type: nextType,
    options: input.options ?? existingDefinition.options,
  });
  const usageCount =
    nextGameKey !== existingDefinition.gameKey ||
    nextAttrKey !== existingDefinition.attrKey ||
    nextType !== existingDefinition.type
      ? await countGameAttributeUsage(prisma, existingDefinition.attrKey)
      : 0;

  if (usageCount > 0) {
    throw new DomainError(
      "ATTRIBUTE_IN_USE",
      `已有 ${usageCount} 个账号使用该属性，不能修改属性标识或类型。`,
      409,
    );
  }

  if (nextType === "select") {
    assertSelectOptions(nextOptions);
  }

  if (
    nextGameKey !== existingDefinition.gameKey ||
    nextAttrKey !== existingDefinition.attrKey
  ) {
    const conflict = await prisma.gameAttributeDefinition.findUnique({
      where: {
        gameKey_attrKey: {
          gameKey: nextGameKey,
          attrKey: nextAttrKey,
        },
      },
    });

    if (conflict && conflict.id !== existing.id) {
      throw new DomainError("DUPLICATE_ATTRIBUTE", "该属性标识已存在");
    }
  }

  const definition = await prisma.gameAttributeDefinition.update({
    where: { id },
    data: {
      gameKey: input.gameKey,
      attrKey: input.attrKey,
      label: input.label,
      type: input.type,
      unit: nextType === "number" ? input.unit : null,
      options: nextOptions as unknown as Prisma.InputJsonValue,
      enabled: input.enabled,
      sortOrder: input.sortOrder,
    },
  });

  return serializeGameAttributeDefinition(definition);
}

export async function deleteAdminGameAttributeDefinition(
  id: number,
): Promise<GameAttributeDefinition> {
  const existing = await prisma.gameAttributeDefinition.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new DomainError("NOT_FOUND", "属性配置不存在", 404);
  }

  const usageCount = await countGameAttributeUsage(prisma, existing.attrKey);

  if (usageCount > 0) {
    throw new DomainError(
      "ATTRIBUTE_IN_USE",
      `已有 ${usageCount} 个账号使用该属性，不能删除。请先停用或清空账号属性值。`,
      409,
    );
  }

  const definition = await prisma.gameAttributeDefinition.update({
    where: { id },
    data: {
      enabled: false,
      deletedAt: new Date(),
    },
  });

  return serializeGameAttributeDefinition(definition);
}

export async function clearAdminGameAttributeDefinitionValues(
  id: number,
): Promise<{ clearedCount: number }> {
  const existing = await prisma.gameAttributeDefinition.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new DomainError("NOT_FOUND", "属性配置不存在", 404);
  }

  const clearedCount = await prisma.$executeRaw`
    UPDATE "codm_accounts"
    SET "attributes" = "attributes" - ${existing.attrKey}
    WHERE "attributes" ? ${existing.attrKey}
      AND "attributes" ->> ${existing.attrKey} <> ''
  `;

  return { clearedCount };
}

export async function updateCarouselByName(
  name: string,
  input: CarouselUpdateInput,
): Promise<Carousel> {
  const existingCarousel = await prisma.carousel.findUnique({
    where: { name },
  });

  if (!existingCarousel) {
    throw new DomainError("NOT_FOUND", "轮播图配置未找到", 404);
  }

  const items = input.items.map((item, index) => ({
    sort_order: index,
    url: item.url,
    ...(item.linkUrl ? { link_url: item.linkUrl } : {}),
  }));

  const carousel = await prisma.carousel.update({
    where: { name },
    data: { items },
  });

  return serializeCarousel(carousel);
}

export async function listSequenceCounters(): Promise<SequenceCounter[]> {
  const counters = await prisma.sequenceCounter.findMany({
    orderBy: { counterName: "asc" },
  });

  return counters.map(serializeSequenceCounter);
}

export async function createSequenceCounter(
  input: SequenceCounterCreateInput,
): Promise<SequenceCounter> {
  const existingCounter = await prisma.sequenceCounter.findUnique({
    where: { counterName: input.counterName },
  });

  if (existingCounter) {
    throw new DomainError("DUPLICATE_COUNTER", "该计数器名称已存在");
  }

  const counter = await prisma.sequenceCounter.create({
    data: {
      counterName: input.counterName,
      currentValue: input.currentValue,
    },
  });

  return serializeSequenceCounter(counter);
}

export async function getNextSequenceCounterValue(
  counterName: string,
): Promise<{ counterName: string; nextValue: number }> {
  const counter = await prisma.sequenceCounter
    .update({
      where: { counterName },
      data: { currentValue: { increment: 1 } },
    })
    .catch(() => null);

  if (!counter) {
    throw new DomainError("NOT_FOUND", "序号计数器未找到", 404);
  }

  return {
    counterName,
    nextValue: Number(counter.currentValue),
  };
}

export async function resetSequenceCounter(
  counterName: string,
  value: number,
): Promise<SequenceCounter> {
  const counter = await prisma.sequenceCounter
    .update({
      where: { counterName },
      data: { currentValue: value },
    })
    .catch(() => null);

  if (!counter) {
    throw new DomainError("NOT_FOUND", "序号计数器未找到", 404);
  }

  return serializeSequenceCounter(counter);
}
