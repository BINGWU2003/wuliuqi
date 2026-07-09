import {
  getKnowledgeBaseBySlug,
  listKnowledgeCategories,
  searchPublishedKnowledge,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_SOURCE_TYPE } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Card } from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
import { Search } from "lucide-react";
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
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">搜索帮助内容</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            优先查找 FAQ 和帮助文章。
          </p>
        </div>
        <form className="flex gap-2" action="/search">
          <input name="kbSlug" type="hidden" value={base.slug} />
          <Input
            className="h-10"
            defaultValue={q}
            name="q"
            placeholder="输入问题关键词"
          />
          <Button type="submit">
            <Search size={16} />
            搜索
          </Button>
        </form>
        <div className="space-y-2">
          {q && results.length === 0 ? (
            <Card className="rounded-md p-8 text-center text-sm text-muted-foreground shadow-none">
              没有找到相关内容，可以尝试 AI 问答或联系人工。
            </Card>
          ) : null}
          {results.map((result) => (
            <Link
              className="block rounded-md border border-border bg-card p-4 hover:bg-accent"
              href={result.href}
              key={`${result.type}-${result.id}`}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {result.type === KNOWLEDGE_SOURCE_TYPE.faq ? "FAQ" : "文章"}
                </span>
                {result.categoryName ? <span>{result.categoryName}</span> : null}
              </div>
              <div className="mt-2 font-medium">{result.title}</div>
              {result.excerpt ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {result.excerpt}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </DocsShell>
  );
}
