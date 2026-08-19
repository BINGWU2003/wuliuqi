import { searchPublishedKnowledge } from "@wuliuqi/rag-db";
import { KNOWLEDGE_SOURCE_TYPE } from "@wuliuqi/types";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Cards } from "fumadocs-ui/components/card";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { KnowledgeDocsLayout } from "@/components/knowledge-docs-layout";
import { getDocsContext } from "@/lib/docs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索帮助内容",
  description: "搜索已发布的帮助文章和常见问题。",
};

type SearchParams = Promise<{ q?: string; kbSlug?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const kbSlug = params.kbSlug || "buyer-help";
  const query = params.q?.trim() || "";
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  const results = query
    ? await searchPublishedKnowledge({
        knowledgeBaseSlug: context.base.slug,
        query,
        limit: 12,
      })
    : [];

  return (
    <KnowledgeDocsLayout context={context}>
      <DocsPage
        breadcrumb={{ enabled: false }}
        footer={{ enabled: false }}
        full
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
      >
        <DocsTitle>搜索帮助内容</DocsTitle>
        <DocsDescription>
          优先匹配已发布的常见问题和帮助文章，输入具体问题通常更容易找到答案。
        </DocsDescription>
        <DocsBody>
          <form
            className="not-prose my-8 flex flex-col gap-2 sm:flex-row"
            action="/search"
          >
            <input name="kbSlug" type="hidden" value={context.base.slug} />
            <label className="relative flex-1">
              <span className="sr-only">输入帮助问题</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
              <input
                className="h-10 w-full rounded-lg border bg-fd-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-fd-muted-foreground focus:border-fd-ring"
                defaultValue={query}
                name="q"
                placeholder="例如：账号登录失败怎么办？"
              />
            </label>
            <button
              className={buttonVariants({ color: "primary" })}
              type="submit"
            >
              搜索答案
            </button>
          </form>

          <section className="not-prose my-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {query ? `“${query}”的搜索结果` : "开始搜索"}
              </h2>
              {query ? (
                <span className="text-sm text-fd-muted-foreground">
                  {results.length} 条
                </span>
              ) : null}
            </div>

            {!query ? (
              <EmptyState>输入问题关键词，开始查找帮助内容。</EmptyState>
            ) : null}
            {query && results.length === 0 ? (
              <EmptyState>
                没有找到相关内容。你可以换一组关键词，或询问 AI 助手继续定位。
              </EmptyState>
            ) : null}
            {results.length > 0 ? (
              <Cards>
                {results.map((result) => (
                  <Card
                    description={
                      result.excerpt ||
                      (result.type === KNOWLEDGE_SOURCE_TYPE.faq
                        ? "查看常见问题答案"
                        : "查看帮助文章")
                    }
                    href={result.href}
                    key={`${result.type}-${result.id}`}
                    title={result.title}
                  >
                    {result.categoryName ? (
                      <span className="mt-3 block text-xs text-fd-muted-foreground">
                        {result.categoryName}
                      </span>
                    ) : null}
                  </Card>
                ))}
              </Cards>
            ) : null}
          </section>

          {query ? (
            <p className="not-prose text-sm text-fd-muted-foreground">
              仍未解决？
              <Link
                className="ml-1 font-medium text-fd-foreground underline underline-offset-4"
                href={`/kb/${context.base.slug}/ask`}
              >
                询问 AI 助手
              </Link>
            </p>
          ) : null}
        </DocsBody>
      </DocsPage>
    </KnowledgeDocsLayout>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-fd-muted-foreground">
      {children}
    </div>
  );
}
