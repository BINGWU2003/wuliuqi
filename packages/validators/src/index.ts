import { z } from "zod";
import {
  ACCOUNT_SORT,
  ACCOUNT_SORT_VALUES,
  ACCOUNT_STATUS,
  CHAT_ROLES,
  DEFAULT_GAME_KEY,
  EMAIL_BIND_STATUS,
  GAME_ATTRIBUTE_TYPES,
  GAME_KEYS,
  HOME_GAME_FILTER,
  HOME_GAME_FILTERS,
  KNOWLEDGE_SOURCE_TYPE_VALUES,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_STATUS_VALUES,
  KNOWLEDGE_VISIBILITY,
  KNOWLEDGE_VISIBILITY_VALUES,
} from "@wuliuqi/types";

export { ACCOUNT_STATUS, EMAIL_BIND_STATUS, GAME_KEYS } from "@wuliuqi/types";

const gameKeyQueryField = z
  .enum(GAME_KEYS)
  .optional();

const gameKeyBodyField = z.enum(GAME_KEYS).optional();
const accountStatusFieldSchema = z.union([
  z.literal(ACCOUNT_STATUS.listed),
  z.literal(ACCOUNT_STATUS.unlisted),
  z.literal(ACCOUNT_STATUS.sold),
]);
const writableAccountStatusFieldSchema = z.union([
  z.literal(ACCOUNT_STATUS.listed),
  z.literal(ACCOUNT_STATUS.unlisted),
]);
const emailBindStatusFieldSchema = z.union([
  z.literal(EMAIL_BIND_STATUS.bound),
  z.literal(EMAIL_BIND_STATUS.unbound),
]);

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

const optionalShortString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const accountAttributeValueSchema = z.union([z.number(), z.string()]);

export const accountAttributesSchema = z.record(
  z.string().trim().min(1),
  accountAttributeValueSchema,
);

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
    game_key: gameKeyQueryField,
    keyword: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    status: optionalNumberFromQuery.pipe(
      accountStatusFieldSchema.optional(),
    ),
    min_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
    max_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
    sort: z
      .enum(ACCOUNT_SORT_VALUES)
      .optional()
      .default(ACCOUNT_SORT.latest),
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

export const shopHomeAccountListQuerySchema = z.object({
  cursor: optionalString,
  game_key: z.enum(HOME_GAME_FILTERS).optional().default(HOME_GAME_FILTER.all),
  limit: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 12))
    .pipe(z.number().int().min(1).max(30)),
  min_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
  max_price: optionalNumberFromQuery.pipe(z.number().min(0).optional()),
  sort: z
    .enum(ACCOUNT_SORT_VALUES)
    .optional()
    .default(ACCOUNT_SORT.latest),
}).refine(
  (query) =>
    query.min_price === undefined ||
    query.max_price === undefined ||
    query.min_price <= query.max_price,
  {
    message: "最低价格不能大于最高价格",
    path: ["min_price"],
  },
);

export type ShopHomeAccountListQuery = z.infer<
  typeof shopHomeAccountListQuerySchema
>;

export const adminAccountListQuerySchema = accountListQuerySchema;

export const adminAccountCreateSchema = z.object({
  gameKey: gameKeyBodyField,
  serialNumber: optionalString,
  images: z.array(z.string().trim().min(1)).min(1, "请至少上传一张图片"),
  attributes: accountAttributesSchema.default({}),
  price: z.coerce.number().min(0, "价格不能为负数"),
  costPrice: z.coerce.number().min(0, "成本价不能为负数").default(0),
  title: z.string().trim().min(1, "标题为必填项"),
  description: z.string().trim().min(1, "描述为必填项"),
  xianyuUrl: optionalString,
  email: optionalString,
  status: writableAccountStatusFieldSchema.default(ACCOUNT_STATUS.listed),
});

export const adminAccountUpdateSchema = z
  .object({
    serialNumber: optionalString,
    images: z
      .array(z.string().trim().min(1))
      .min(1, "请至少上传一张图片")
      .optional(),
    attributes: accountAttributesSchema.optional(),
    price: z.coerce.number().min(0, "价格不能为负数").optional(),
    costPrice: z.coerce.number().min(0, "成本价不能为负数").optional(),
    title: z.string().trim().min(1, "标题为必填项").optional(),
    description: z.string().trim().min(1, "描述为必填项").optional(),
    xianyuUrl: optionalString,
    email: optionalString,
    status: writableAccountStatusFieldSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "请至少提供一个要更新的字段",
  });

export const accountStatusSchema = z.object({
  status: writableAccountStatusFieldSchema,
});

export const adminAccountSellSchema = z.object({
  soldPrice: z.coerce.number().min(0, "成交价不能为负数"),
});

export const adminEmailListQuerySchema = z.object({
  ...paginationQuery,
  game_key: gameKeyQueryField,
  keyword: optionalString,
  bind_status: optionalNumberFromQuery.pipe(
    emailBindStatusFieldSchema.optional(),
  ),
});

const emailPrefixSchema = z.string().trim().min(1, "邮箱前缀为必填项").max(64);

const newEmailPrefixSchema = emailPrefixSchema.refine(
  (value) => !value.includes("@"),
  "邮箱前缀不能包含 @",
);

const emailPostfixSchema = z
  .string()
  .trim()
  .min(2, "邮箱后缀为必填项")
  .max(255);

const emailPostfixBodySchema = emailPostfixSchema.transform((value) =>
  value.startsWith("@") ? value : `@${value}`,
);

export const adminEmailCreateSchema = z.object({
  gameKey: gameKeyBodyField,
  prefix: newEmailPrefixSchema,
  postfix: emailPostfixBodySchema,
  bindStatus: emailBindStatusFieldSchema.default(EMAIL_BIND_STATUS.unbound),
});

export const adminEmailUpdateSchema = z
  .object({
    prefix: emailPrefixSchema.optional(),
    postfix: emailPostfixBodySchema.optional(),
    bindStatus: emailBindStatusFieldSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "请至少提供一个要更新的字段",
  });

export const emailPostfixCreateSchema = z.object({
  postfix: emailPostfixBodySchema,
  enabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const emailPostfixUpdateSchema = z
  .object({
    postfix: emailPostfixBodySchema.optional(),
    enabled: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "请至少提供一个要更新的字段",
  });

export const emailBindStatusSchema = z.object({
  bindStatus: emailBindStatusFieldSchema,
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

export const gameAttributeOptionSchema = z.object({
  label: z.string().trim().min(1, "选项名称为必填项").max(80),
  value: z.string().trim().min(1, "选项值为必填项").max(80),
});

const gameAttributeDefinitionBaseSchema = z.object({
  gameKey: z.string().trim().min(1).max(50).default(DEFAULT_GAME_KEY),
  attrKey: z
    .string()
    .trim()
    .min(1, "属性标识为必填项")
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/, "属性标识只能包含小写字母、数字和下划线"),
  label: z.string().trim().min(1, "属性名称为必填项").max(80),
  type: z.enum(GAME_ATTRIBUTE_TYPES),
  unit: optionalShortString.pipe(z.string().max(20).optional()),
  options: z.array(gameAttributeOptionSchema).default([]),
  enabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function validateAttributeDefinitionOptions(
  definition: {
    type?: (typeof GAME_ATTRIBUTE_TYPES)[number];
    options?: Array<{ value: string }>;
  },
  context: z.RefinementCtx,
) {
  const options = definition.options ?? [];

  if (definition.type === "select" && options.length === 0) {
    context.addIssue({
      code: "custom",
      message: "下拉属性至少需要一个选项",
      path: ["options"],
    });
  }

  const optionValues = new Set<string>();

  for (const [index, option] of options.entries()) {
    if (optionValues.has(option.value)) {
      context.addIssue({
        code: "custom",
        message: "选项值不能重复",
        path: ["options", index, "value"],
      });
    }

    optionValues.add(option.value);
  }
}

export const gameAttributeDefinitionCreateSchema =
  gameAttributeDefinitionBaseSchema.superRefine(
    validateAttributeDefinitionOptions,
  );

export const gameAttributeDefinitionUpdateSchema =
  gameAttributeDefinitionBaseSchema
    .partial()
    .superRefine(validateAttributeDefinitionOptions)
    .refine((data) => Object.keys(data).length > 0, {
      message: "请至少提供一个要更新的字段",
    });

export const loginSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "密码为必填项"),
});

const slugSchema = z
  .string()
  .trim()
  .min(1, "路径标识为必填项")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "路径标识只能包含小写字母、数字和连字符",
  );

const stringListSchema = z
  .union([
    z.array(z.string().trim().min(1)),
    z
      .string()
      .trim()
      .transform((value) =>
        value
          ? value
              .split(/[,\n，]/)
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      ),
  ])
  .default([]);

export const knowledgeStatusSchema = z
  .enum(KNOWLEDGE_STATUS_VALUES)
  .default(KNOWLEDGE_STATUS.draft);

export const knowledgeBaseCreateSchema = z.object({
  name: z.string().trim().min(1, "知识库名称为必填项").max(100),
  slug: slugSchema,
  description: optionalString,
  visibility: z
    .enum(KNOWLEDGE_VISIBILITY_VALUES)
    .default(KNOWLEDGE_VISIBILITY.public),
  status: z.enum(KNOWLEDGE_STATUS_VALUES).default(KNOWLEDGE_STATUS.published),
});

export const knowledgeBaseUpdateSchema = knowledgeBaseCreateSchema.partial();

export const knowledgeCategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "分类名称为必填项").max(80),
  slug: slugSchema,
  description: optionalString,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const knowledgeCategoryUpdateSchema =
  knowledgeCategoryCreateSchema.partial();

export const knowledgeArticleCreateSchema = z.object({
  categoryId: optionalString,
  title: z.string().trim().min(1, "文章标题为必填项").max(160),
  slug: slugSchema,
  excerpt: optionalString,
  content: z.string().trim().min(1, "文章内容为必填项"),
  status: knowledgeStatusSchema,
  tags: stringListSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const knowledgeArticleUpdateSchema =
  knowledgeArticleCreateSchema.partial();

export const faqItemCreateSchema = z.object({
  categoryId: optionalString,
  question: z.string().trim().min(1, "问题为必填项").max(240),
  answer: z.string().trim().min(1, "答案为必填项"),
  aliases: stringListSchema,
  status: knowledgeStatusSchema,
  tags: stringListSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const faqItemUpdateSchema = faqItemCreateSchema.partial();

export const sourceIndexSchema = z.object({
  sourceType: z.enum(KNOWLEDGE_SOURCE_TYPE_VALUES),
  sourceId: z.string().uuid("索引对象 ID 无效"),
});

export const publicSearchQuerySchema = z.object({
  kbSlug: slugSchema.default("buyer-help"),
  q: z.string().trim().min(1, "请输入搜索关键词").max(200),
});

export const chatMessageSchema = z.object({
  role: z.enum(CHAT_ROLES),
  content: z.string().trim().min(1).max(4000),
});

export const publicChatSchema = z.object({
  kbSlug: slugSchema.default("buyer-help"),
  messages: z.array(chatMessageSchema).min(1).max(30),
});

export type AdminAccountListQuery = z.infer<typeof adminAccountListQuerySchema>;
export type AdminAccountCreateInput = z.infer<typeof adminAccountCreateSchema>;
export type AdminAccountUpdateInput = z.infer<typeof adminAccountUpdateSchema>;
export type AdminAccountSellInput = z.infer<typeof adminAccountSellSchema>;
export type GameAttributeDefinitionCreateInput = z.infer<
  typeof gameAttributeDefinitionCreateSchema
>;
export type GameAttributeDefinitionUpdateInput = z.infer<
  typeof gameAttributeDefinitionUpdateSchema
>;
export type AdminEmailListQuery = z.infer<typeof adminEmailListQuerySchema>;
export type AdminEmailCreateInput = z.infer<typeof adminEmailCreateSchema>;
export type AdminEmailUpdateInput = z.infer<typeof adminEmailUpdateSchema>;
export type EmailPostfixCreateInput = z.infer<typeof emailPostfixCreateSchema>;
export type EmailPostfixUpdateInput = z.infer<typeof emailPostfixUpdateSchema>;
export type CarouselUpdateInput = z.infer<typeof carouselUpdateSchema>;
export type SequenceCounterCreateInput = z.infer<
  typeof sequenceCounterCreateSchema
>;
export type LoginInput = z.infer<typeof loginSchema>;
export type KnowledgeBaseCreateInput = z.infer<
  typeof knowledgeBaseCreateSchema
>;
export type KnowledgeBaseUpdateInput = z.infer<
  typeof knowledgeBaseUpdateSchema
>;
export type KnowledgeCategoryCreateInput = z.infer<
  typeof knowledgeCategoryCreateSchema
>;
export type KnowledgeCategoryUpdateInput = z.infer<
  typeof knowledgeCategoryUpdateSchema
>;
export type KnowledgeArticleCreateInput = z.infer<
  typeof knowledgeArticleCreateSchema
>;
export type KnowledgeArticleUpdateInput = z.infer<
  typeof knowledgeArticleUpdateSchema
>;
export type FaqItemCreateInput = z.infer<typeof faqItemCreateSchema>;
export type FaqItemUpdateInput = z.infer<typeof faqItemUpdateSchema>;
export type PublicSearchQuery = z.infer<typeof publicSearchQuerySchema>;
export type PublicChatInput = z.infer<typeof publicChatSchema>;
