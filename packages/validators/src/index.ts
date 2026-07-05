import { z } from "zod";

const optionalNumberFromQuery = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined));

export const accountListQuerySchema = z
  .object({
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
