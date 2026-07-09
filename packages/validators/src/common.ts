import { z } from "zod";
import {
  ACCOUNT_STATUS,
  EMAIL_BIND_STATUS,
  GAME_KEYS,
} from "@wuliuqi/types";

export const gameKeyQueryField = z
  .enum(GAME_KEYS)
  .optional();

export const gameKeyBodyField = z.enum(GAME_KEYS).optional();

export const accountStatusFieldSchema = z.union([
  z.literal(ACCOUNT_STATUS.listed),
  z.literal(ACCOUNT_STATUS.unlisted),
  z.literal(ACCOUNT_STATUS.sold),
]);

export const writableAccountStatusFieldSchema = z.union([
  z.literal(ACCOUNT_STATUS.listed),
  z.literal(ACCOUNT_STATUS.unlisted),
]);

export const emailBindStatusFieldSchema = z.union([
  z.literal(EMAIL_BIND_STATUS.bound),
  z.literal(EMAIL_BIND_STATUS.unbound),
]);

export const optionalNumberFromQuery = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : undefined));

export const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const optionalShortString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const paginationQuery = {
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
