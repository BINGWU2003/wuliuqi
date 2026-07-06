import {
  getKnowledgeBaseBySlug,
  getPublishedArticleBySlug,
  listKnowledgeCategories,
  searchPublishedKnowledge,
} from "@wuliuqi/rag-db";
import { Alert, AlertDescription, AlertTitle } from "@wuliuqi/ui/components/alert";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wuliuqi/ui/components/card";
import { Bot } from "lucide-react";
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
        <Card className="sticky top-20 rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="text-base">相关内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {related
              .filter((item) => item.href !== `/kb/${base.slug}/docs/${article.slug}`)
              .slice(0, 4)
              .map((item) => (
                <Link
                  className="block rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  href={item.href}
                  key={item.id}
                >
                  {item.title}
                </Link>
              ))}
          </CardContent>
        </Card>
      }
    >
      <article className="rounded-md border border-border bg-card p-5 sm:p-8">
        <h1 className="text-3xl font-bold tracking-normal">{article.title}</h1>
        {article.excerpt ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {article.excerpt}
          </p>
        ) : null}
        <Alert className="mt-6">
          <AlertTitle>需要进一步确认？</AlertTitle>
          <AlertDescription>
            你可以针对本文继续询问 AI 助手；涉及订单、支付、隐私和售后争议的问题请联系人工。
          </AlertDescription>
        </Alert>
        <div className="mt-8">
          <MarkdownContent content={article.content} />
        </div>
        <div className="mt-8 border-t border-border pt-5">
          <Button asChild variant="outline">
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
