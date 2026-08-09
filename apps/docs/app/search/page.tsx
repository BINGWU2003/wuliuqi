import {
  getKnowledgeBaseBySlug,
  listKnowledgeCategories,
  searchPublishedKnowledge,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_SOURCE_TYPE } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Input } from "@wuliuqi/ui/components/input";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; kbSlug?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const kbSlug = params.kbSlug || "buyer-help";
  const q = params.q?.trim() || "";
  const base = await getKnowledgeBaseBySlug(kbSlug);

  if (!base) {
    notFound();
  }

  const [categories, results] = await Promise.all([
    listKnowledgeCategories(base.id),
    q
      ? searchPublishedKnowledge({
          knowledgeBaseSlug: base.slug,
          query: q,
          limit: 12,
        })
      : Promise.resolve([]),
  ]);

  return (
    <DocsShell base={base} categories={categories}>
      <div className="space-y-8">
        <header className="border-b border-line pb-8">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
            <span className="h-px w-5 bg-brand" />
            Search the help desk
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            搜索帮助内容
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-muted">
            优先匹配已发布的 FAQ 和帮助文章，输入具体问题通常更容易找到答案。
          </p>
        </header>
        <form
          className="flex flex-col gap-2 rounded-sm border border-line bg-surface p-3 sm:flex-row"
          action="/search"
        >
          <input name="kbSlug" type="hidden" value={base.slug} />
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            />
            <Input
              aria-label="输入帮助问题"
              className="h-11 rounded-sm border-line bg-canvas pl-10 shadow-none focus-visible:ring-brand"
              defaultValue={q}
              name="q"
              placeholder="例如：账号登录失败怎么办？"
            />
          </div>
          <Button className="docs-primary-action h-11 rounded-sm px-6" type="submit">
            搜索答案
          </Button>
        </form>
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
                Results
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight">
                {q ? `“${q}” 的结果` : "等待搜索"}
              </h2>
            </div>
            {q ? (
              <span className="font-mono text-xs text-ink-muted">
                {String(results.length).padStart(2, "0")}
              </span>
            ) : null}
          </div>
          <div className="mt-5 border-t-2 border-ink">
          {!q ? (
            <div className="border-b border-line py-10 text-sm leading-6 text-ink-muted">
              输入问题关键词，开始查找帮助内容。
            </div>
          ) : null}
          {q && results.length === 0 ? (
            <div className="border-b border-line bg-brand-soft/50 px-4 py-8 text-sm leading-6 text-ink-muted">
              没有找到相关内容。你可以换一组关键词，或让 567 助手继续定位。
            </div>
          ) : null}
          {results.map((result) => (
            <Link
              className="group grid gap-3 border-b border-line py-4 transition-colors hover:bg-brand-soft/60 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-start sm:px-2"
              href={result.href}
              key={`${result.type}-${result.id}`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-strong dark:text-brand">
                {result.type === KNOWLEDGE_SOURCE_TYPE.faq ? "FAQ" : "Article"}
                {result.categoryName ? (
                  <span className="mt-1 block normal-case tracking-normal text-ink-muted">
                    {result.categoryName}
                  </span>
                ) : null}
              </div>
              <div>
                <div className="font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                  {result.title}
                </div>
                {result.excerpt ? (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-ink-muted">
                    {result.excerpt}
                  </p>
                ) : null}
              </div>
              <ArrowUpRight className="hidden size-4 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
            </Link>
          ))}
          </div>
        </section>
      </div>
    </DocsShell>
  );
}
