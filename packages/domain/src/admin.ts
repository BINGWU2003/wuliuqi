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

  const [prefix, ...rest] = email.split("@");
  const postfix = rest.join("@");

  if (!prefix || !postfix) {
    return null;
  }

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

async function findEmailRecord(
  tx: TransactionClient,
  email?: string | null,
) {
  const parts = parseEmailAddress(email);

  if (!parts) {
    return null;
  }

  return tx.codmEmail.findFirst({
    where: {
      prefix: parts.prefix,
      postfix: parts.postfix,
    },
  });
}

async function setEmailBindStatus(
  tx: TransactionClient,
  email?: string | null,
  bindStatus?: 1 | 2,
) {
  if (!email || bindStatus === undefined) {
    return;
  }

  const record = await findEmailRecord(tx, email);

  if (record && record.bindStatus !== bindStatus) {
    await tx.codmEmail.update({
      where: { id: record.id },
      data: { bindStatus },
    });
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

  const [total, accounts] = await Promise.all([
    prisma.codmAccount.count({ where }),
    prisma.codmAccount.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

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
    const serialNumber =
      input.serialNumber ??
      `#CODM-${String(await getNextCounterValue(tx, "CODM_ACCOUNT"))}`;

    const existingAccount = await tx.codmAccount.findUnique({
      where: { serialNumber },
    });

    if (existingAccount) {
      throw new DomainError("DUPLICATE_SERIAL", "该序列号已存在");
    }

    const emailRecord = await findEmailRecord(tx, input.email);

    if (emailRecord?.bindStatus === 1) {
      throw new DomainError("EMAIL_BOUND", "该邮箱已被其他账号绑定，无法使用");
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

    await setEmailBindStatus(tx, input.email, input.status === 1 ? 1 : 2);

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
    const emailChanged =
      input.email !== undefined && input.email !== existingAccount.email;
    const nextEmail =
      input.email !== undefined ? input.email : existingAccount.email;

    if (emailChanged) {
      const nextEmailRecord = await findEmailRecord(tx, nextEmail);

      if (nextEmailRecord?.bindStatus === 1) {
        throw new DomainError("EMAIL_BOUND", "该邮箱已被其他账号绑定，无法使用");
      }

      await setEmailBindStatus(tx, existingAccount.email, 2);
      await setEmailBindStatus(tx, nextEmail, nextStatus === 1 ? 1 : 2);
    } else if (input.status !== undefined) {
      await setEmailBindStatus(tx, nextEmail, nextStatus === 1 ? 1 : 2);
    }

    const account = await tx.codmAccount.update({
      where: { id },
      data: accountWriteData(input),
    });

    return serializeAccount(account);
  });
}

export async function deleteAdminAccount(id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.codmAccount.findUnique({ where: { id } });

    if (!existingAccount) {
      throw new DomainError("NOT_FOUND", "CODM账号未找到", 404);
    }

    await setEmailBindStatus(tx, existingAccount.email, 2);
    await tx.codmAccount.delete({ where: { id } });
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

    if (status === 1 && existingAccount.email && existingAccount.status !== 1) {
      const emailRecord = await findEmailRecord(tx, existingAccount.email);

      if (emailRecord?.bindStatus === 1) {
        throw new DomainError("EMAIL_BOUND", "该邮箱已被绑定，无法上架");
      }
    }

    await setEmailBindStatus(tx, existingAccount.email, status === 1 ? 1 : 2);

    const account = await tx.codmAccount.update({
      where: { id },
      data: { status },
    });

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

  const [total, emails] = await Promise.all([
    prisma.codmEmail.count({ where }),
    prisma.codmEmail.findMany({
      where,
      orderBy: [{ postfix: "asc" }, { updatedAt: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    list: emails.map(serializeEmail),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    keyword: query.keyword,
  };
}

export async function getAdminEmailById(id: number): Promise<AdminEmail | null> {
  const email = await prisma.codmEmail.findUnique({ where: { id } });

  return email ? serializeEmail(email) : null;
}

export async function createAdminEmail(
  input: AdminEmailCreateInput,
): Promise<AdminEmail> {
  const existingEmail = await prisma.codmEmail.findFirst({
    where: { prefix: input.prefix, postfix: input.postfix },
  });

  if (existingEmail) {
    throw new DomainError("DUPLICATE_EMAIL", "该邮箱已存在");
  }

  const email = await prisma.codmEmail.create({
    data: {
      prefix: input.prefix,
      postfix: input.postfix,
      bindStatus: input.bindStatus,
    },
  });

  return serializeEmail(email);
}

export async function updateAdminEmail(
  id: number,
  input: AdminEmailUpdateInput,
): Promise<AdminEmail> {
  const existingEmail = await prisma.codmEmail.findUnique({ where: { id } });

  if (!existingEmail) {
    throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
  }

  const nextPrefix = input.prefix ?? existingEmail.prefix;
  const nextPostfix = input.postfix ?? existingEmail.postfix;
  const addressChanged =
    nextPrefix !== existingEmail.prefix || nextPostfix !== existingEmail.postfix;

  if (existingEmail.bindStatus === 1 && addressChanged) {
    throw new DomainError("EMAIL_BOUND", "该邮箱已绑定账号，无法修改邮箱地址");
  }

  if (addressChanged) {
    const conflictEmail = await prisma.codmEmail.findFirst({
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

  const email = await prisma.codmEmail.update({
    where: { id },
    data: {
      prefix: input.prefix,
      postfix: input.postfix,
      bindStatus: input.bindStatus,
    },
  });

  return serializeEmail(email);
}

export async function deleteAdminEmail(id: number): Promise<void> {
  const existingEmail = await prisma.codmEmail.findUnique({ where: { id } });

  if (!existingEmail) {
    throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
  }

  if (existingEmail.bindStatus === 1) {
    throw new DomainError("EMAIL_BOUND", "该邮箱已绑定账号，无法删除");
  }

  await prisma.codmEmail.delete({ where: { id } });
}

export async function updateAdminEmailBindStatus(
  id: number,
  bindStatus: 1 | 2,
): Promise<AdminEmail> {
  const existingEmail = await prisma.codmEmail.findUnique({ where: { id } });

  if (!existingEmail) {
    throw new DomainError("NOT_FOUND", "CODM邮箱未找到", 404);
  }

  const email = await prisma.codmEmail.update({
    where: { id },
    data: { bindStatus },
  });

  return serializeEmail(email);
}

export async function updateCarouselByName(
  name: string,
  input: CarouselUpdateInput,
): Promise<Carousel> {
  const existingCarousel = await prisma.carousel.findUnique({ where: { name } });

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
