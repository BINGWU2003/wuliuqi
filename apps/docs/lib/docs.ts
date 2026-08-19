import {
  getKnowledgeBaseBySlug,
  listKnowledgeArticles,
  listKnowledgeCategories,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import type { KnowledgeArticle, KnowledgeCategory } from "@wuliuqi/types";
import type { Root } from "fumadocs-core/page-tree";
import { cache } from "react";

export const getDocsContext = cache(async (kbSlug: string) => {
  const base = await getKnowledgeBaseBySlug(kbSlug);

  if (!base) {
    return null;
  }

  const [categories, allArticles] = await Promise.all([
    listKnowledgeCategories(base.id),
    listKnowledgeArticles(base.id),
  ]);
  const articles = allArticles.filter(
    (article) => article.status === KNOWLEDGE_STATUS.published,
  );

  return {
    base,
    categories,
    articles,
    tree: buildPageTree(base.slug, base.name, categories, articles),
  };
});

function buildPageTree(
  kbSlug: string,
  baseName: string,
  categories: KnowledgeCategory[],
  articles: KnowledgeArticle[],
): Root {
  const categoryIds = new Set(categories.map((category) => category.id));
  const uncategorized = articles.filter(
    (article) => !article.categoryId || !categoryIds.has(article.categoryId),
  );

  return {
    type: "root",
    name: baseName,
    children: [
      {
        type: "page",
        name: "帮助中心首页",
        url: `/kb/${kbSlug}`,
      },
      ...categories.map((category) => ({
        type: "folder" as const,
        name: category.name,
        description: category.description,
        defaultOpen: true,
        index: {
          type: "page" as const,
          name: category.name,
          url: `/kb/${kbSlug}/categories/${category.slug}`,
        },
        children: articles
          .filter((article) => article.categoryId === category.id)
          .map((article) => ({
            type: "page" as const,
            name: article.title,
            description: article.excerpt,
            url: `/kb/${kbSlug}/docs/${article.slug}`,
          })),
      })),
      ...(uncategorized.length > 0
        ? [
            {
              type: "folder" as const,
              name: "其他文章",
              defaultOpen: true,
              children: uncategorized.map((article) => ({
                type: "page" as const,
                name: article.title,
                description: article.excerpt,
                url: `/kb/${kbSlug}/docs/${article.slug}`,
              })),
            },
          ]
        : []),
    ],
  };
}

export type DocsContext = NonNullable<
  Awaited<ReturnType<typeof getDocsContext>>
>;
