import { z } from "zod";
import {
  ACCOUNT_SORT,
  ACCOUNT_SORT_VALUES,
  ACCOUNT_STATUS,
  HOME_GAME_FILTER,
  HOME_GAME_FILTERS,
} from "@wuliuqi/types";
import {
  accountStatusFieldSchema,
  gameKeyBodyField,
  gameKeyQueryField,
  optionalNumberFromQuery,
  optionalString,
  paginationQuery,
  writableAccountStatusFieldSchema,
} from "./common";

const accountAttributeValueSchema = z.union([z.number(), z.string()]);

export const accountAttributesSchema = z.record(
  z.string().trim().min(1),
  accountAttributeValueSchema,
);

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

export type AdminAccountListQuery = z.infer<typeof adminAccountListQuerySchema>;
export type AdminAccountCreateInput = z.infer<typeof adminAccountCreateSchema>;
export type AdminAccountUpdateInput = z.infer<typeof adminAccountUpdateSchema>;
export type AdminAccountSellInput = z.infer<typeof adminAccountSellSchema>;
