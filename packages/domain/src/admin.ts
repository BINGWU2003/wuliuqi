import type { Prisma } from "@prisma/client";
import type {
  AdminAccount,
  AdminAccountListResult,
  AdminEmail,
  AdminEmailListResult,
  Carousel,
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
  SequenceCounterCreateInput,
} from "@wuliuqi/validators";
import { prisma } from "@wuliuqi/db";
import {
  serializeAccount,
  serializeCarousel,
  serializeEmail,
  serializeSequenceCounter,
} from "./serializers";

type TransactionClient = Prisma.TransactionClient;
type AccountLookupClient = Pick<TransactionClient, "codmAccount">;
type LinkedEmailAccount = {
  id: bigint;
  serialNumber: string;
};

const ACCOUNT_LISTED_STATUS = 1;
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

  const listedAccount = await tx.codmAccount.findFirst({
    where: {
      email,
      status: ACCOUNT_LISTED_STATUS,
    },
    select: { id: true },
  });

  return listedAccount ? EMAIL_BOUND_STATUS : EMAIL_UNBOUND_STATUS;
}

async function findLinkedAccountByEmail(
  client: AccountLookupClient,
  email?: string | null,
): Promise<LinkedEmailAccount | null> {
  if (!email) {
    return null;
  }

  return client.codmAccount.findFirst({
    where: { email },
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
    throw new DomainError("EMAIL_REQUIRED", "上架账号必须绑定邮箱");
  }

  const boundAccount = await tx.codmAccount.findFirst({
    where: {
      email,
      status: ACCOUNT_LISTED_STATUS,
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
      `该邮箱已被上架账号 ${boundAccount.serialNumber} 绑定，无法使用`,
    );
  }
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

function accountWriteData(input: AdminAccountUpdateInput) {
  return {
    serialNumber: input.serialNumber,
    images: input.images,
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

  const total = await prisma.codmAccount.count({ where });
  const accounts = await prisma.codmAccount.findMany({
    where,
    orderBy,
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });

  return {
    list: accounts.map(serializeAccount),
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
  const account = await prisma.codmAccount.findUnique({ where: { id } });

  return account ? serializeAccount(account) : null;
}

export async function createAdminAccount(
  input: AdminAccountCreateInput,
): Promise<AdminAccount> {
  assertValidOptionalUrl(input.xianyuUrl);

  return prisma.$transaction(async (tx) => {
    if (input.status === ACCOUNT_LISTED_STATUS) {
      await assertListedAccountCanUseEmail(tx, input.email);
    }

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
        price: input.price,
        title: input.title,
        describe: input.description,
        xianyuUrl: input.xianyuUrl,
        email: input.email,
        status: input.status,
      },
    });

    await syncEmailBindStatusFromAccounts(tx, input.email);

    return serializeAccount(account);
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

    const nextStatus = input.status ?? existingAccount.status;
    const nextEmail =
      input.email !== undefined ? input.email : existingAccount.email;

    if (nextStatus === ACCOUNT_LISTED_STATUS) {
      await assertListedAccountCanUseEmail(tx, nextEmail, id);
    }

    const account = await tx.codmAccount.update({
      where: { id },
      data: accountWriteData(input),
    });

    await syncEmailBindStatusFromAccounts(tx, existingAccount.email);

    if (nextEmail !== existingAccount.email) {
      await syncEmailBindStatusFromAccounts(tx, nextEmail);
    }

    return serializeAccount(account);
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

    if (status === ACCOUNT_LISTED_STATUS) {
      await assertListedAccountCanUseEmail(tx, existingAccount.email, id);
    }

    const account = await tx.codmAccount.update({
      where: { id },
      data: { status },
    });

    await syncEmailBindStatusFromAccounts(tx, existingAccount.email);

    return serializeAccount(account);
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
