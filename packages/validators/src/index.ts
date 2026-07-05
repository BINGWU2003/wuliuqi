import { z } from "zod";

export const ACCOUNT_STATUS = {
  listed: 1,
  unlisted: 2,
} as const;

export const EMAIL_BIND_STATUS = {
  bound: 1,
  unbound: 2,
} as const;

const optionalNumberFromQuery = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined));

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const paginationQuery = {
  page: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 10))
    .pipe(z.number().int().min(1).max(100)),
};

export const accountListQuerySchema = z
  .object({
    ...paginationQuery,
    keyword: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    status: optionalNumberFromQuery.pipe(z.number().int().min(1).max(2).optional()),
    min_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
    max_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
    sort: z
      .enum(["latest", "price_asc", "price_desc"])
      .optional()
      .default("latest"),
  })
  .refine(
    (query) =>
      query.min_price === undefined ||
      query.max_price === undefined ||
      query.min_price <= query.max_price,
    {
      message: "最低价格不能大于最高价格",
      path: ["min_price"],
    },
  );

export type AccountListQuery = z.infer<typeof accountListQuerySchema>;

export const adminAccountListQuerySchema = accountListQuerySchema;

export const adminAccountCreateSchema = z.object({
  serialNumber: optionalString,
  images: z.array(z.string().trim().min(1)).min(1, "请至少上传一张图片"),
  price: z.coerce.number().min(0, "价格不能为负数"),
  title: z.string().trim().min(1, "标题为必填项"),
  description: z.string().trim().min(1, "描述为必填项"),
  xianyuUrl: optionalString,
  email: optionalString,
  status: z.union([z.literal(1), z.literal(2)]).default(1),
});

export const adminAccountUpdateSchema = adminAccountCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "请至少提供一个要更新的字段",
  });

export const accountStatusSchema = z.object({
  status: z.union([z.literal(1), z.literal(2)]),
});

export const adminEmailListQuerySchema = z.object({
  ...paginationQuery,
  keyword: optionalString,
  bind_status: optionalNumberFromQuery.pipe(
    z.number().int().min(1).max(2).optional(),
  ),
});

export const adminEmailCreateSchema = z.object({
  prefix: z.string().trim().min(1, "邮箱前缀为必填项").max(64),
  postfix: z
    .string()
    .trim()
    .min(2, "邮箱后缀为必填项")
    .max(255)
    .refine((value) => value.startsWith("@"), "邮箱后缀必须以 @ 开头"),
  bindStatus: z.union([z.literal(1), z.literal(2)]).default(2),
});

export const adminEmailUpdateSchema = adminEmailCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "请至少提供一个要更新的字段",
  });

export const emailBindStatusSchema = z.object({
  bindStatus: z.union([z.literal(1), z.literal(2)]),
});

export const carouselItemSchema = z.object({
  sortOrder: z.coerce.number().int().min(0),
  url: z.string().trim().min(1, "图片地址为必填项"),
  linkUrl: optionalString,
});

export const carouselUpdateSchema = z.object({
  items: z.array(carouselItemSchema).min(1, "请至少保留一张轮播图").max(6),
});

export const sequenceCounterCreateSchema = z.object({
  counterName: z.string().trim().min(1, "计数器名称为必填项").max(50),
  currentValue: z.coerce.number().int().min(0).default(0),
});

export const sequenceCounterResetSchema = z.object({
  value: z.coerce.number().int().min(0).default(0),
});

export const loginSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "密码为必填项"),
});

export type AdminAccountListQuery = z.infer<typeof adminAccountListQuerySchema>;
export type AdminAccountCreateInput = z.infer<typeof adminAccountCreateSchema>;
export type AdminAccountUpdateInput = z.infer<typeof adminAccountUpdateSchema>;
export type AdminEmailListQuery = z.infer<typeof adminEmailListQuerySchema>;
export type AdminEmailCreateInput = z.infer<typeof adminEmailCreateSchema>;
export type AdminEmailUpdateInput = z.infer<typeof adminEmailUpdateSchema>;
export type CarouselUpdateInput = z.infer<typeof carouselUpdateSchema>;
export type SequenceCounterCreateInput = z.infer<
  typeof sequenceCounterCreateSchema
>;
export type LoginInput = z.infer<typeof loginSchema>;
