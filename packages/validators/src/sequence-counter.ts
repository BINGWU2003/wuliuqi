import { z } from "zod";

export const sequenceCounterCreateSchema = z.object({
  counterName: z.string().trim().min(1, "计数器名称为必填项").max(50),
  currentValue: z.coerce.number().int().min(0).default(0),
});

export const sequenceCounterResetSchema = z.object({
  value: z.coerce.number().int().min(0).default(0),
});

export type SequenceCounterCreateInput = z.infer<
  typeof sequenceCounterCreateSchema
>;
