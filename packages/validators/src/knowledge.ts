import { z } from "zod";
import {
  CHAT_ROLES,
  KNOWLEDGE_SOURCE_TYPE_VALUES,
  KNOWLEDGE_STATUS,
  KNOWLEDGE_STATUS_VALUES,
  KNOWLEDGE_VISIBILITY,
  KNOWLEDGE_VISIBILITY_VALUES,
} from "@wuliuqi/types";
import { optionalString } from "./common.js";

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
