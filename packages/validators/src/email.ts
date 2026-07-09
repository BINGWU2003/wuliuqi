import { z } from "zod";
import { EMAIL_BIND_STATUS } from "@wuliuqi/types";
import {
  emailBindStatusFieldSchema,
  gameKeyBodyField,
  gameKeyQueryField,
  optionalNumberFromQuery,
  optionalString,
  paginationQuery,
} from "./common";

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

export type AdminEmailListQuery = z.infer<typeof adminEmailListQuerySchema>;
export type AdminEmailCreateInput = z.infer<typeof adminEmailCreateSchema>;
export type AdminEmailUpdateInput = z.infer<typeof adminEmailUpdateSchema>;
export type EmailPostfixCreateInput = z.infer<typeof emailPostfixCreateSchema>;
export type EmailPostfixUpdateInput = z.infer<typeof emailPostfixUpdateSchema>;
