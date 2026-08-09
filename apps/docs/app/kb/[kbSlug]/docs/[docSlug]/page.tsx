import {
  getKnowledgeBaseBySlug,
  getPublishedArticleBySlug,
  listKnowledgeCategories,
  searchPublishedKnowledge,
} from "@wuliuqi/rag-db";
import { Alert, AlertDescription, AlertTitle } from "@wuliuqi/ui/components/alert";
import { Button } from "@wuliuqi/ui/components/button";
import { ArrowUpRight, Bot } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";
import { MarkdownContent } from "@/components/markdown-content";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string; docSlug: string }>;

export default async function ArticlePage({ params }: { params: Params }) {
  const { kbSlug, docSlug } = await params;
  const [base, article] = await Promise.all([
    getKnowledgeBaseBySlug(kbSlug),
    getPublishedArticleBySlug(kbSlug, docSlug),
  ]);

  if (!base || !article) {
    notFound();
  }

  const [categories, related] = await Promise.all([
    listKnowledgeCategories(base.id),
    searchPublishedKnowledge({
      knowledgeBaseSlug: base.slug,
      query: article.title,
      limit: 4,
    }),
  ]);
  const articleCategory = categories.find(
    (category) => category.id === article.categoryId,
  );

  return (
    <DocsShell
      activeHref={
        articleCategory
          ? `/kb/${base.slug}/categories/${articleCategory.slug}`
          : undefined
      }
      base={base}
      categories={categories}
      aside={
        <div className="sticky top-24 border-t-2 border-ink pt-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
            Related reading
          </p>
          <h2 className="mt-2 text-base font-bold">相关内容</h2>
          <div className="mt-4 border-t border-line text-sm">
            {related.filter(
              (item) => item.href !== `/kb/${base.slug}/docs/${article.slug}`,
            ).length === 0 ? (
              <p className="border-b border-line py-4 text-ink-muted">暂无相关内容。</p>
            ) : null}
            {related
              .filter((item) => item.href !== `/kb/${base.slug}/docs/${article.slug}`)
              .slice(0, 4)
              .map((item) => (
                <Link
                  className="group flex items-start justify-between gap-2 border-b border-line py-3 text-ink-muted hover:text-brand"
                  href={item.href}
                  key={item.id}
                >
                  <span>{item.title}</span>
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
          </div>
        </div>
      }
    >
      <article className="rounded-sm border border-line bg-surface p-5 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          <Link className="hover:text-brand" href={`/kb/${base.slug}`}>
            帮助中心
          </Link>
          <span aria-hidden="true">/</span>
          {articleCategory ? (
            <Link
              className="hover:text-brand"
              href={`/kb/${base.slug}/categories/${articleCategory.slug}`}
            >
              {articleCategory.name}
            </Link>
          ) : (
            <span>帮助文章</span>
          )}
        </div>
        <h1 className="mt-6 max-w-3xl text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
          {article.title}
        </h1>
        {article.excerpt ? (
          <p className="mt-4 max-w-2xl border-l-2 border-brand pl-4 text-[15px] leading-7 text-ink-muted">
            {article.excerpt}
          </p>
        ) : null}
        <Alert className="mt-8 rounded-sm border-line bg-brand-soft/60">
          <AlertTitle className="font-semibold">需要进一步确认？</AlertTitle>
          <AlertDescription className="leading-6 text-ink-muted">
            你可以针对本文继续询问 AI 助手；涉及订单、支付、隐私和售后争议的问题请联系人工。
          </AlertDescription>
        </Alert>
        <div className="mt-10">
          <MarkdownContent content={article.content} />
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <Button
            asChild
            className="rounded-sm border-line bg-transparent hover:bg-brand-soft hover:text-ink"
            variant="outline"
          >
            <Link href={`/kb/${base.slug}/ask`}>
              <Bot size={16} />
              针对本文提问
            </Link>
          </Button>
        </div>
      </article>
    </DocsShell>
  );
}
