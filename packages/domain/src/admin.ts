import { Prisma } from "@prisma/client";
import {
  ACCOUNT_SORT,
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_LABELS,
  DEFAULT_GAME_KEY,
  EMAIL_BIND_STATUS,
  GAME_KEY,
} from "@wuliuqi/types";
import type {
  AccountWritableStatus,
  AccountAttributes,
  AdminAccount,
  AdminAccountListResult,
  AdminAccountStatistics,
  AdminEmail,
  AdminEmailPostfix,
  AdminEmailListResult,
  EmailBindStatus,
  Carousel,
  GameAttributeDefinition,
  GameAttributeOption,
  GameKey,
  SequenceCounter,
} from "@wuliuqi/types";
import type {
  AdminAccountCreateInput,
  AdminAccountListQuery,
  AdminAccountSellInput,
  AdminAccountUpdateInput,
  AdminEmailCreateInput,
  AdminEmailListQuery,
  AdminEmailUpdateInput,
  CarouselUpdateInput,
  EmailPostfixCreateInput,
  EmailPostfixUpdateInput,
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
  serializeEmailPostfix,
  serializeGameAttributeDefinition,
  serializeSequenceCounter,
} from "./serializers";
import type { AccountRecord as SerializedAccountRecord } from "./serializers";
import {
  accountDelegate,
  emailDelegate,
  GAME_OPTIONS,
  gameConfig,
  normalizeGameKey,
} from "./games";

type TransactionClient = Prisma.TransactionClient;
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
  createdAt: Date;
  updatedAt: Date;
};
type EmailPostfixRecord = {
  id: bigint;
  gameKey: string;
  postfix: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const CODM_GAME_KEY: GameKey = DEFAULT_GAME_KEY;
const ACCOUNT_LISTED_STATUS = ACCOUNT_STATUS.listed;
const ACCOUNT_UNLISTED_STATUS = ACCOUNT_STATUS.unlisted;
const ACCOUNT_SOLD_STATUS = ACCOUNT_STATUS.sold;
const EMAIL_BOUND_STATUS = EMAIL_BIND_STATUS.bound;
const EMAIL_UNBOUND_STATUS = EMAIL_BIND_STATUS.unbound;
const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
} as const;
const ACCOUNT_STATUSES = [
  {
    status: ACCOUNT_LISTED_STATUS,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_LISTED_STATUS],
  },
  {
    status: ACCOUNT_UNLISTED_STATUS,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_UNLISTED_STATUS],
  },
  {
    status: ACCOUNT_SOLD_STATUS,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_SOLD_STATUS],
  },
] as const;

function serializeAdminAccount(
  account: SerializedAccountRecord,
  attributeDefinitions: GameAttributeDefinition[],
  gameKey: GameKey,
) {
  return serializeAccount(account, attributeDefinitions, gameKey, {
    includeFinancials: true,
  });
}

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

function numberFromDb(value: unknown) {
  return value === null || value === undefined ? 0 : Number(value);
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

function normalizeEmailPostfix(postfix: string): string {
  const trimmed = postfix.trim();

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

async function getEmailPostfixUsageCount(
  client: unknown,
  postfix: string,
): Promise<number> {
  const [codmUsageCount, sanguoshaUsageCount] = await Promise.all([
    emailDelegate(client, GAME_KEY.codm).count({ where: { postfix } }),
    emailDelegate(client, GAME_KEY.sanguosha).count({ where: { postfix } }),
  ]);

  return Number(codmUsageCount ?? 0) + Number(sanguoshaUsageCount ?? 0);
}

async function serializeEmailPostfixWithUsage(
  client: unknown,
  postfix: EmailPostfixRecord,
): Promise<AdminEmailPostfix> {
  const usageCount = await getEmailPostfixUsageCount(client, postfix.postfix);

  return serializeEmailPostfix({ ...postfix, usageCount });
}

async function assertEmailPostfixEnabled(
  tx: TransactionClient,
  postfix: string,
) {
  const emailPostfix = await tx.gameEmailPostfix.findFirst({
    where: {
      postfix,
      enabled: true,
    },
  });

  if (!emailPostfix) {
    throw new DomainError("EMAIL_POSTFIX_DISABLED", "邮箱后缀未启用或不存在");
  }
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
  gameKey: string | null = CODM_GAME_KEY,
  enabledOnly = false,
): Promise<GameAttributeDefinition[]> {
  const normalizedGameKey = normalizeGameKey(gameKey);
  const definitions = await client.gameAttributeDefinition.findMany({
    where: {
      gameKey: normalizedGameKey,
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
  gameKey: GameKey,
) {
  const definitions = await listAttributeDefinitionsForGame(
    client,
    gameKey,
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
  gameKey: string | null = CODM_GAME_KEY,
) {
  const accountTable = Prisma.raw(
    normalizeGameKey(gameKey) === GAME_KEY.sanguosha
      ? '"sanguosha_accounts"'
      : '"codm_accounts"',
  );
  const [row] = await client.$queryRaw<Array<{ usageCount: bigint }>>`
    SELECT count(*)::bigint AS "usageCount"
    FROM ${accountTable}
    WHERE "attributes" ? ${attrKey}
      AND "attributes" ->> ${attrKey} <> ''
  `;

  return Number(row?.usageCount ?? 0);
}

async function listGameAttributeUsageCounts(gameKey: string) {
  const normalizedGameKey = normalizeGameKey(gameKey);
  const accountTable = Prisma.raw(
    normalizedGameKey === GAME_KEY.sanguosha
      ? '"sanguosha_accounts"'
      : '"codm_accounts"',
  );
  const rows = await prisma.$queryRaw<
    Array<{ id: bigint; usageCount: bigint }>
  >`
    SELECT
      definitions."id",
      count(accounts."id")::bigint AS "usageCount"
    FROM "game_attribute_definitions" definitions
    LEFT JOIN ${accountTable} accounts
      ON accounts."attributes" ? definitions."attr_key"
      AND accounts."attributes" ->> definitions."attr_key" <> ''
    WHERE definitions."game_key" = ${normalizedGameKey}
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
  gameKey: GameKey = CODM_GAME_KEY,
): Promise<EmailBindStatus> {
  if (!email) {
    return EMAIL_UNBOUND_STATUS;
  }

  const accounts = accountDelegate(tx, gameKey);
  const activeAccount = await accounts.findFirst({
    where: {
      email,
      status: { not: ACCOUNT_SOLD_STATUS },
    },
    select: { id: true },
  });

  return activeAccount ? EMAIL_BOUND_STATUS : EMAIL_UNBOUND_STATUS;
}

async function findLinkedAccountByEmail(
  client: unknown,
  email?: string | null,
  gameKey: GameKey = CODM_GAME_KEY,
): Promise<LinkedEmailAccount | null> {
  if (!email) {
    return null;
  }

  return accountDelegate(client, gameKey).findFirst({
    where: {
      email,
      status: { not: ACCOUNT_SOLD_STATUS },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      serialNumber: true,
    },
  }) as Promise<LinkedEmailAccount | null>;
}

async function assertEmailAddressNotLinked(
  tx: TransactionClient,
  email: string,
  action: string,
  gameKey: GameKey = CODM_GAME_KEY,
) {
  const linkedAccount = await findLinkedAccountByEmail(tx, email, gameKey);

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
  gameKey: GameKey = CODM_GAME_KEY,
) {
  const parts = parseEmailAddress(email);

  if (!parts) {
    return;
  }

  const bindStatus = await getExpectedEmailBindStatus(tx, email, gameKey);

  await emailDelegate(tx, gameKey).updateMany({
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
  gameKey: GameKey = CODM_GAME_KEY,
) {
  if (!email) {
    throw new DomainError("EMAIL_REQUIRED", "账号必须绑定邮箱");
  }

  const boundAccount = await accountDelegate(tx, gameKey).findFirst({
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

  const linkedAccount = boundAccount as { serialNumber: string } | null;

  if (linkedAccount) {
    throw new DomainError(
      "EMAIL_BOUND",
      `该邮箱已被账号 ${linkedAccount.serialNumber} 绑定，无法使用`,
    );
  }
}

async function getEmailRecordByAddress(
  tx: TransactionClient,
  email: string,
  gameKey: GameKey = CODM_GAME_KEY,
): Promise<EmailRecord> {
  const parts = parseEmailAddress(email);

  if (!parts) {
    throw new DomainError("BAD_REQUEST", "邮箱格式无效");
  }

  const emailRecord = await emailDelegate(tx, gameKey).findFirst({
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

  return emailRecord as EmailRecord;
}

async function assertAccountEmailForWrite(
  tx: TransactionClient,
  email?: string | null,
  currentAccountId?: number,
  gameKey: GameKey = CODM_GAME_KEY,
): Promise<EmailRecord> {
  if (!email) {
    throw new DomainError("EMAIL_REQUIRED", "账号必须绑定邮箱");
  }

  const emailRecord = await getEmailRecordByAddress(tx, email, gameKey);

  await assertListedAccountCanUseEmail(tx, email, currentAccountId, gameKey);

  return emailRecord;
}

async function markEmailBindStatus(
  tx: TransactionClient,
  emailRecord: Pick<EmailRecord, "id">,
  bindStatus: EmailBindStatus,
  gameKey: GameKey = CODM_GAME_KEY,
) {
  await emailDelegate(tx, gameKey).update({
    where: { id: emailRecord.id },
    data: { bindStatus },
  });
}

async function releaseEmailBindStatus(
  tx: TransactionClient,
  email?: string | null,
  gameKey: GameKey = CODM_GAME_KEY,
) {
  const parts = parseEmailAddress(email);

  if (!parts) {
    return;
  }

  await emailDelegate(tx, gameKey).updateMany({
    where: {
      prefix: parts.prefix,
      postfix: parts.postfix,
      NOT: { bindStatus: EMAIL_UNBOUND_STATUS },
    },
    data: { bindStatus: EMAIL_UNBOUND_STATUS },
  });
}

async function getNextCounterValue(
  tx: TransactionClient,
  counterName: string,
  label?: string,
) {
  try {
    const counter = await tx.sequenceCounter.update({
      where: { counterName },
      data: { currentValue: { increment: 1 } },
    });

    return counter.currentValue;
  } catch {
    throw new DomainError(
      "COUNTER_NOT_FOUND",
      label
        ? `${label} ${counterName} 不存在，请先初始化该计数器`
        : `计数器 ${counterName} 不存在`,
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
    costPrice: input.costPrice,
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
  const gameKey = normalizeGameKey(query.game_key);
  const accountsDelegate = accountDelegate(prisma, gameKey);
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

  if (query.updated_from !== undefined || query.updated_to !== undefined) {
    where.updatedAt = {
      gte: query.updated_from,
      lte: query.updated_to,
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
    query.sort === ACCOUNT_SORT.priceAsc
      ? { price: "asc" }
      : query.sort === ACCOUNT_SORT.priceDesc
        ? { price: "desc" }
        : { updatedAt: "desc" };

  const [total, accounts, attributeDefinitions] = await Promise.all([
    accountsDelegate.count({ where }),
    accountsDelegate.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    listAttributeDefinitionsForGame(prisma, gameKey),
  ]);

  return {
    list: (accounts as SerializedAccountRecord[]).map((account) =>
      serializeAdminAccount(account, attributeDefinitions, gameKey),
    ),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    keyword: query.keyword,
    gameKey,
    priceRange:
      query.min_price !== undefined || query.max_price !== undefined
        ? { minPrice: query.min_price, maxPrice: query.max_price }
        : undefined,
  };
}

export async function getAdminAccountStatistics(
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminAccountStatistics> {
  const gameKey = normalizeGameKey(gameKeyInput);
  const accountsDelegate = accountDelegate(prisma, gameKey);
  const [
    totalAggregate,
    statusGroups,
    recentSold,
    highValueAvailable,
    staleListed,
    attributeDefinitions,
  ] = await Promise.all([
    accountsDelegate.aggregate({
      _count: { _all: true },
      _sum: { price: true, costPrice: true, soldPrice: true },
    }),
    accountsDelegate.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { price: true, costPrice: true, soldPrice: true },
    }),
    accountsDelegate.findMany({
      where: { status: ACCOUNT_SOLD_STATUS },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    accountsDelegate.findMany({
      where: { status: { in: [ACCOUNT_LISTED_STATUS, ACCOUNT_UNLISTED_STATUS] } },
      orderBy: [{ price: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    accountsDelegate.findMany({
      where: { status: ACCOUNT_LISTED_STATUS },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    listAttributeDefinitionsForGame(prisma, gameKey),
  ]);
  const statusMap = new Map(
    (statusGroups as Array<{
      status: number;
      _count: { _all: number };
      _sum: { price: unknown; costPrice: unknown; soldPrice: unknown };
    }>).map((group) => [
      group.status,
      {
        count: group._count._all,
        priceValue: numberFromDb(group._sum.price),
        totalCost: numberFromDb(group._sum.costPrice),
        totalRevenue: numberFromDb(group._sum.soldPrice),
      },
    ]),
  );
  const statusBreakdown = ACCOUNT_STATUSES.map(({ label, status }) => ({
    status,
    label,
    count: statusMap.get(status)?.count ?? 0,
    totalValue:
      status === ACCOUNT_SOLD_STATUS
        ? (statusMap.get(status)?.totalRevenue ?? 0)
        : (statusMap.get(status)?.priceValue ?? 0),
    totalCost: statusMap.get(status)?.totalCost ?? 0,
    totalRevenue: statusMap.get(status)?.totalRevenue ?? 0,
  }));
  const listed = statusBreakdown.find(
    (item) => item.status === ACCOUNT_LISTED_STATUS,
  ) ?? {
    count: 0,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_LISTED_STATUS],
    status: ACCOUNT_LISTED_STATUS,
    totalCost: 0,
    totalRevenue: 0,
    totalValue: 0,
  };
  const unlisted = statusBreakdown.find(
    (item) => item.status === ACCOUNT_UNLISTED_STATUS,
  ) ?? {
    count: 0,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_UNLISTED_STATUS],
    status: ACCOUNT_UNLISTED_STATUS,
    totalCost: 0,
    totalRevenue: 0,
    totalValue: 0,
  };
  const sold = statusBreakdown.find(
    (item) => item.status === ACCOUNT_SOLD_STATUS,
  ) ?? {
    count: 0,
    label: ACCOUNT_STATUS_LABELS[ACCOUNT_SOLD_STATUS],
    status: ACCOUNT_SOLD_STATUS,
    totalCost: 0,
    totalRevenue: 0,
    totalValue: 0,
  };
  const total = totalAggregate as {
    _count: { _all: number };
    _sum: { price: unknown; costPrice: unknown; soldPrice: unknown };
  };
  const soldRevenue = sold.totalRevenue;
  const soldCost = sold.totalCost;
  const availableCost = listed.totalCost + unlisted.totalCost;
  const availableValue = listed.totalValue + unlisted.totalValue;

  return {
    summary: {
      totalCount: total._count._all,
      listedCount: listed.count,
      unlistedCount: unlisted.count,
      soldCount: sold.count,
      totalValue: numberFromDb(total._sum.price),
      totalCost: numberFromDb(total._sum.costPrice),
      listedValue: listed.totalValue,
      listedCost: listed.totalCost,
      unlistedValue: unlisted.totalValue,
      unlistedCost: unlisted.totalCost,
      soldValue: soldRevenue,
      soldRevenue,
      soldCost,
      soldProfit: Number((soldRevenue - soldCost).toFixed(2)),
      availableValue,
      availableCost,
      availableEstimatedProfit: Number(
        (availableValue - availableCost).toFixed(2),
      ),
    },
    statusBreakdown,
    recentSold: (recentSold as SerializedAccountRecord[]).map((account) =>
      serializeAdminAccount(account, attributeDefinitions, gameKey),
    ),
    highValueAvailable: (
      highValueAvailable as SerializedAccountRecord[]
    ).map((account) =>
      serializeAdminAccount(account, attributeDefinitions, gameKey),
    ),
    staleListed: (staleListed as SerializedAccountRecord[]).map((account) =>
      serializeAdminAccount(account, attributeDefinitions, gameKey),
    ),
  };
}

export async function getAdminAccountById(
  id: number,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminAccount | null> {
  const gameKey = normalizeGameKey(gameKeyInput);
  const [account, attributeDefinitions] = await Promise.all([
    accountDelegate(prisma, gameKey).findUnique({ where: { id } }),
    listAttributeDefinitionsForGame(prisma, gameKey),
  ]);

  return account
    ? serializeAdminAccount(
        account as SerializedAccountRecord,
        attributeDefinitions,
        gameKey,
      )
    : null;
}

export async function createAdminAccount(
  input: AdminAccountCreateInput,
): Promise<AdminAccount> {
  assertValidOptionalUrl(input.xianyuUrl);
  const game = gameConfig(input.gameKey);
  const attributeDefinitions = await listAttributeDefinitionsForGame(
    prisma,
    game.key,
    true,
  );
  const attributes = normalizeAccountAttributesForWrite(
    input.attributes,
    attributeDefinitions,
  );

  return prisma.$transaction(async (tx) => {
    const accounts = accountDelegate(tx, game.key);

    const emailRecord = await assertAccountEmailForWrite(
      tx,
      input.email,
      undefined,
      game.key,
    );

    const serialNumber =
      input.serialNumber ??
      `${game.serialPrefix}${String(
        await getNextCounterValue(
          tx,
          game.accountCounterName,
          `${game.label}账号序号计数器`,
        ),
      )}`;

    const existingAccount = await accounts.findUnique({
      where: { serialNumber },
    });

    if (existingAccount) {
      throw new DomainError("DUPLICATE_SERIAL", "该序列号已存在");
    }

    const account = await accounts.create({
      data: {
        serialNumber,
        images: input.images,
        attributes,
        price: input.price,
        costPrice: input.costPrice,
        title: input.title,
        describe: input.description,
        xianyuUrl: input.xianyuUrl,
        email: input.email,
        status: input.status,
      },
    });

    await markEmailBindStatus(tx, emailRecord, EMAIL_BOUND_STATUS, game.key);

    return serializeAdminAccount(
      account as SerializedAccountRecord,
      attributeDefinitions,
      game.key,
    );
  }, TRANSACTION_OPTIONS);
}

export async function updateAdminAccount(
  id: number,
  input: AdminAccountUpdateInput,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminAccount> {
  assertValidOptionalUrl(input.xianyuUrl);
  const gameKey = normalizeGameKey(gameKeyInput);

  return prisma.$transaction(async (tx) => {
    const accounts = accountDelegate(tx, gameKey);
    const existingAccount = (await accounts.findUnique({
      where: { id },
    })) as SerializedAccountRecord | null;

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "账号未找到", 404);
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
      gameKey,
    );

    if (
      input.serialNumber &&
      input.serialNumber !== existingAccount.serialNumber
    ) {
      const serialAccount = (await accounts.findUnique({
        where: { serialNumber: input.serialNumber },
      })) as SerializedAccountRecord | null;

      if (serialAccount && serialAccount.id !== existingAccount.id) {
        throw new DomainError("DUPLICATE_SERIAL", "该序列号已被其他账号使用");
      }
    }

    const nextEmail =
      input.email !== undefined ? input.email : existingAccount.email;
    const emailChanged = nextEmail !== existingAccount.email;

    const nextEmailRecord = await assertAccountEmailForWrite(
      tx,
      nextEmail,
      id,
      gameKey,
    );

    const attributes =
      input.attributes === undefined
        ? undefined
        : normalizeAccountAttributesForWrite(
            input.attributes,
            attributeDefinitions,
            existingAttributes,
          );

    const account = await accounts.update({
      where: { id },
      data: accountWriteData(input, attributes),
    });

    if (emailChanged) {
      await releaseEmailBindStatus(tx, existingAccount.email, gameKey);
      await markEmailBindStatus(
        tx,
        nextEmailRecord,
        EMAIL_BOUND_STATUS,
        gameKey,
      );
    }

    return serializeAdminAccount(
      account as SerializedAccountRecord,
      attributeDefinitions,
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function deleteAdminAccount(
  id: number,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<void> {
  const gameKey = normalizeGameKey(gameKeyInput);

  await prisma.$transaction(async (tx) => {
    const accounts = accountDelegate(tx, gameKey);
    const existingAccount = (await accounts.findUnique({
      where: { id },
    })) as SerializedAccountRecord | null;

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "账号未找到", 404);
    }

    await accounts.delete({ where: { id } });
    await syncEmailBindStatusFromAccounts(tx, existingAccount.email, gameKey);
  }, TRANSACTION_OPTIONS);
}

export async function updateAdminAccountStatus(
  id: number,
  status: AccountWritableStatus,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminAccount> {
  const gameKey = normalizeGameKey(gameKeyInput);

  return prisma.$transaction(async (tx) => {
    const accounts = accountDelegate(tx, gameKey);
    const existingAccount = (await accounts.findUnique({
      where: { id },
    })) as SerializedAccountRecord | null;

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "账号未找到", 404);
    }

    if (existingAccount.status === ACCOUNT_SOLD_STATUS) {
      throw new DomainError(
        "ACCOUNT_SOLD",
        "已出售账号不可变更上下架状态",
        409,
      );
    }

    await assertAccountEmailForWrite(tx, existingAccount.email, id, gameKey);

    const account = await accounts.update({
      where: { id },
      data: { status },
    });

    const attributeDefinitions = await listAttributeDefinitionsForGame(
      tx,
      gameKey,
    );

    return serializeAdminAccount(
      account as SerializedAccountRecord,
      attributeDefinitions,
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function sellAdminAccount(
  id: number,
  input: AdminAccountSellInput,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminAccount> {
  const gameKey = normalizeGameKey(gameKeyInput);

  return prisma.$transaction(async (tx) => {
    const accounts = accountDelegate(tx, gameKey);
    const existingAccount = (await accounts.findUnique({
      where: { id },
    })) as SerializedAccountRecord | null;

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "账号未找到", 404);
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
      gameKey,
    );

    const account = await accounts.update({
      where: { id },
      data: {
        email: null,
        soldAt: new Date(),
        soldPrice: input.soldPrice,
        status: ACCOUNT_SOLD_STATUS,
      },
    });

    await markEmailBindStatus(tx, emailRecord, EMAIL_UNBOUND_STATUS, gameKey);

    const attributeDefinitions = await listAttributeDefinitionsForGame(
      tx,
      gameKey,
    );

    return serializeAdminAccount(
      account as SerializedAccountRecord,
      attributeDefinitions,
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function listAdminEmailPostfixes(): Promise<AdminEmailPostfix[]> {
  const postfixes = (await prisma.gameEmailPostfix.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  })) as EmailPostfixRecord[];

  return Promise.all(
    postfixes.map((postfix) => serializeEmailPostfixWithUsage(prisma, postfix)),
  );
}

export async function createAdminEmailPostfix(
  input: EmailPostfixCreateInput,
): Promise<AdminEmailPostfix> {
  const postfix = normalizeEmailPostfix(input.postfix);
  const existingPostfix = await prisma.gameEmailPostfix.findUnique({
    where: { postfix },
  });

  if (existingPostfix) {
    throw new DomainError("DUPLICATE_EMAIL_POSTFIX", "该邮箱后缀已存在");
  }

  const created = (await prisma.gameEmailPostfix.create({
    data: {
      gameKey: "global",
      postfix,
      enabled: input.enabled,
      sortOrder: input.sortOrder,
    },
  })) as EmailPostfixRecord;

  return serializeEmailPostfixWithUsage(prisma, created);
}

export async function updateAdminEmailPostfix(
  id: number,
  input: EmailPostfixUpdateInput,
): Promise<AdminEmailPostfix> {
  const existingPostfix = (await prisma.gameEmailPostfix.findUnique({
    where: { id },
  })) as EmailPostfixRecord | null;

  if (!existingPostfix) {
    throw new DomainError("NOT_FOUND", "邮箱后缀不存在", 404);
  }

  const nextPostfix =
    input.postfix === undefined
      ? existingPostfix.postfix
      : normalizeEmailPostfix(input.postfix);

  if (nextPostfix !== existingPostfix.postfix) {
    const usageCount = await getEmailPostfixUsageCount(
      prisma,
      existingPostfix.postfix,
    );

    if (usageCount > 0) {
      throw new DomainError(
        "EMAIL_POSTFIX_IN_USE",
        "该邮箱后缀已被邮箱使用，只能停用，不能修改",
        409,
      );
    }

    const conflictPostfix = await prisma.gameEmailPostfix.findUnique({
      where: { postfix: nextPostfix },
    });

    if (conflictPostfix) {
      throw new DomainError("DUPLICATE_EMAIL_POSTFIX", "该邮箱后缀已存在");
    }
  }

  const updated = (await prisma.gameEmailPostfix.update({
    where: { id },
    data: {
      postfix: input.postfix === undefined ? undefined : nextPostfix,
      enabled: input.enabled,
      sortOrder: input.sortOrder,
    },
  })) as EmailPostfixRecord;

  return serializeEmailPostfixWithUsage(prisma, updated);
}

export async function deleteAdminEmailPostfix(id: number): Promise<void> {
  const existingPostfix = (await prisma.gameEmailPostfix.findUnique({
    where: { id },
  })) as EmailPostfixRecord | null;

  if (!existingPostfix) {
    throw new DomainError("NOT_FOUND", "邮箱后缀不存在", 404);
  }

  const usageCount = await getEmailPostfixUsageCount(
    prisma,
    existingPostfix.postfix,
  );

  if (usageCount > 0) {
    throw new DomainError(
      "EMAIL_POSTFIX_IN_USE",
      "该邮箱后缀已被邮箱使用，只能停用，不能删除",
      409,
    );
  }

  await prisma.gameEmailPostfix.delete({ where: { id } });
}

export async function listAdminEmails(
  query: AdminEmailListQuery,
): Promise<AdminEmailListResult> {
  const gameKey = normalizeGameKey(query.game_key);
  const emailsDelegate = emailDelegate(prisma, gameKey);
  const accounts = accountDelegate(prisma, gameKey);
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

  const total = await emailsDelegate.count({ where });
  const emails = await emailsDelegate.findMany({
    where,
    orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  }) as EmailRecord[];
  const emailAddresses = emails.map(
    (email) => `${email.prefix}${email.postfix}`,
  );
  const boundAccounts =
    emailAddresses.length > 0
      ? await accounts.findMany({
          where: {
            email: { in: emailAddresses },
          },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          select: {
            email: true,
            id: true,
            serialNumber: true,
          },
        }) as Array<LinkedEmailAccount & { email: string | null }>
      : [];
  const accountByEmail = new Map<string, LinkedEmailAccount>();

  for (const account of boundAccounts) {
    if (account.email && !accountByEmail.has(account.email)) {
      accountByEmail.set(account.email, account);
    }
  }

  return {
    list: emails.map((email) => {
      const boundAccount = accountByEmail.get(
        `${email.prefix}${email.postfix}`,
      );

      return serializeEmail({
        ...email,
        boundAccountId: boundAccount?.id,
        boundAccountSerialNumber: boundAccount?.serialNumber,
      }, gameKey);
    }),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    keyword: query.keyword,
    gameKey,
  };
}

export async function getAdminEmailById(
  id: number,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminEmail | null> {
  const gameKey = normalizeGameKey(gameKeyInput);
  const email = (await emailDelegate(prisma, gameKey).findUnique({
    where: { id },
  })) as (EmailRecord & { createdAt: Date; updatedAt: Date }) | null;

  if (!email) {
    return null;
  }

  const linkedAccount = await findLinkedAccountByEmail(
    prisma,
    composeEmailAddress(email.prefix, email.postfix),
    gameKey,
  );

  return serializeEmail({
    ...email,
    boundAccountId: linkedAccount?.id,
    boundAccountSerialNumber: linkedAccount?.serialNumber,
  }, gameKey);
}

export async function createAdminEmail(
  input: AdminEmailCreateInput,
): Promise<AdminEmail> {
  assertNewEmailPrefix(input.prefix);
  const gameKey = normalizeGameKey(input.gameKey);
  const postfix = normalizeEmailPostfix(input.postfix);

  return prisma.$transaction(async (tx) => {
    const emails = emailDelegate(tx, gameKey);
    const existingEmail = await emails.findFirst({
      where: { prefix: input.prefix, postfix },
    });

    if (existingEmail) {
      throw new DomainError("DUPLICATE_EMAIL", "该邮箱已存在");
    }

    await assertEmailPostfixEnabled(tx, postfix);

    const bindStatus = await getExpectedEmailBindStatus(
      tx,
      composeEmailAddress(input.prefix, postfix),
      gameKey,
    );
    const email = await emails.create({
      data: {
        prefix: input.prefix,
        postfix,
        bindStatus,
      },
    });

    return serializeEmail(
      email as EmailRecord & { createdAt: Date; updatedAt: Date },
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function updateAdminEmail(
  id: number,
  input: AdminEmailUpdateInput,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminEmail> {
  const gameKey = normalizeGameKey(gameKeyInput);

  return prisma.$transaction(async (tx) => {
    const emails = emailDelegate(tx, gameKey);
    const existingEmail = (await emails.findUnique({
      where: { id },
    })) as (EmailRecord & { createdAt: Date; updatedAt: Date }) | null;

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "邮箱未找到", 404);
    }

    const nextPrefix = input.prefix ?? existingEmail.prefix;
    const nextPostfix =
      input.postfix === undefined
        ? existingEmail.postfix
        : normalizeEmailPostfix(input.postfix);
    const existingAddress = composeEmailAddress(
      existingEmail.prefix,
      existingEmail.postfix,
    );
    const nextAddress = composeEmailAddress(nextPrefix, nextPostfix);
    const addressChanged = nextAddress !== existingAddress;

    assertEmailPrefixMutation(existingEmail.prefix, nextPrefix);

    if (addressChanged) {
      await assertEmailAddressNotLinked(
        tx,
        existingAddress,
        "修改邮箱地址",
        gameKey,
      );
      await assertEmailPostfixEnabled(tx, nextPostfix);
    }

    if (addressChanged) {
      const conflictEmail = await emails.findFirst({
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

    const bindStatus = await getExpectedEmailBindStatus(
      tx,
      nextAddress,
      gameKey,
    );
    const email = await emails.update({
      where: { id },
      data: {
        prefix: input.prefix,
        postfix: input.postfix === undefined ? undefined : nextPostfix,
        bindStatus,
      },
    });

    return serializeEmail(
      email as EmailRecord & { createdAt: Date; updatedAt: Date },
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function deleteAdminEmail(
  id: number,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<void> {
  const gameKey = normalizeGameKey(gameKeyInput);

  await prisma.$transaction(async (tx) => {
    const emails = emailDelegate(tx, gameKey);
    const existingEmail = (await emails.findUnique({
      where: { id },
    })) as EmailRecord | null;

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "邮箱未找到", 404);
    }

    await assertEmailAddressNotLinked(
      tx,
      composeEmailAddress(existingEmail.prefix, existingEmail.postfix),
      "删除",
      gameKey,
    );

    await emails.delete({ where: { id } });
  }, TRANSACTION_OPTIONS);
}

export async function updateAdminEmailBindStatus(
  id: number,
  bindStatus: EmailBindStatus,
  gameKeyInput: string | null = CODM_GAME_KEY,
): Promise<AdminEmail> {
  const gameKey = normalizeGameKey(gameKeyInput);

  return prisma.$transaction(async (tx) => {
    const emails = emailDelegate(tx, gameKey);
    const existingEmail = (await emails.findUnique({
      where: { id },
    })) as (EmailRecord & { createdAt: Date; updatedAt: Date }) | null;

    if (!existingEmail) {
      throw new DomainError("NOT_FOUND", "邮箱未找到", 404);
    }

    const expectedBindStatus = await getExpectedEmailBindStatus(
      tx,
      composeEmailAddress(existingEmail.prefix, existingEmail.postfix),
      gameKey,
    );

    if (bindStatus !== expectedBindStatus) {
      throw new DomainError(
        "EMAIL_BIND_STATUS_CONFLICT",
        expectedBindStatus === EMAIL_BOUND_STATUS
          ? "该邮箱仍被上架账号使用，无法标记为未绑定"
          : "该邮箱没有上架账号使用，无法标记为已绑定",
      );
    }

    const email = await emails.update({
      where: { id },
      data: { bindStatus: expectedBindStatus },
    });

    return serializeEmail(
      email as EmailRecord & { createdAt: Date; updatedAt: Date },
      gameKey,
    );
  }, TRANSACTION_OPTIONS);
}

export async function listAdminGameAttributeDefinitions(
  gameKey: string | null = CODM_GAME_KEY,
): Promise<GameAttributeDefinition[]> {
  const normalizedGameKey = normalizeGameKey(gameKey);
  const [definitions, usageCounts] = await Promise.all([
    prisma.gameAttributeDefinition.findMany({
      where: {
        gameKey: normalizedGameKey,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    listGameAttributeUsageCounts(normalizedGameKey),
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
      ? await countGameAttributeUsage(
          prisma,
          existingDefinition.attrKey,
          nextGameKey,
        )
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

  const usageCount = await countGameAttributeUsage(
    prisma,
    existing.attrKey,
    normalizeGameKey(existing.gameKey),
  );

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
    UPDATE ${Prisma.raw(
      normalizeGameKey(existing.gameKey) === GAME_KEY.sanguosha
        ? '"sanguosha_accounts"'
        : '"codm_accounts"',
    )}
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

function serializeSequenceCounterWithMetadata(
  counter: Parameters<typeof serializeSequenceCounter>[0],
): SequenceCounter {
  const serialized = serializeSequenceCounter(counter);
  const game = GAME_OPTIONS.find(
    (option) => option.accountCounterName === serialized.counterName,
  );

  if (!game) {
    return {
      ...serialized,
      displayName: serialized.counterName,
      purpose: "自定义",
    };
  }

  return {
    ...serialized,
    displayName: `${game.label} 账号编号`,
    gameKey: game.key,
    gameLabel: game.label,
    purpose: "账号编号",
  };
}

export async function listSequenceCounters(): Promise<SequenceCounter[]> {
  const counters = await prisma.sequenceCounter.findMany({
    orderBy: { counterName: "asc" },
  });

  return counters.map(serializeSequenceCounterWithMetadata);
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

  return serializeSequenceCounterWithMetadata(counter);
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

  return serializeSequenceCounterWithMetadata(counter);
}
