import { z } from "zod";
import { DEFAULT_GAME_KEY, GAME_ATTRIBUTE_TYPES } from "@wuliuqi/types";
import { optionalShortString } from "./common";

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

export type GameAttributeDefinitionCreateInput = z.infer<
  typeof gameAttributeDefinitionCreateSchema
>;
export type GameAttributeDefinitionUpdateInput = z.infer<
  typeof gameAttributeDefinitionUpdateSchema
>;
