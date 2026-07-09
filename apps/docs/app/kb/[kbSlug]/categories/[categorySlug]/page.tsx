import {
  getKnowledgeBaseBySlug,
  listFaqItems,
  listKnowledgeCategories,
  listPublishedArticlesByCategory,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wuliuqi/ui/components/card";
import { FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string; categorySlug: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const { kbSlug, categorySlug } = await params;
  const base = await getKnowledgeBaseBySlug(kbSlug);

  if (!base) {
    notFound();
  }

  const categories = await listKnowledgeCategories(base.id);
  const category = categories.find((item) => item.slug === categorySlug);

  if (!category) {
    notFound();
  }

  const [articles, faqs] = await Promise.all([
    listPublishedArticlesByCategory(base.slug, category.slug),
    listFaqItems(base.id),
  ]);
  const categoryFaqs = faqs.filter(
    (faq) =>
      faq.status === KNOWLEDGE_STATUS.published &&
      faq.categoryId === category.id,
  );

  return (
    <DocsShell
      activeHref={`/kb/${base.slug}/categories/${category.slug}`}
      base={base}
      categories={categories}
    >
      <div className="space-y-5">
        <div>
          <Badge variant="secondary">分类</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {category.description}
            </p>
          ) : null}
        </div>
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="text-base">文章</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {articles.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无文章
              </div>
            ) : null}
            {articles.map((article) => (
              <Link
                className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-accent"
                href={`/kb/${base.slug}/docs/${article.slug}`}
                key={article.id}
              >
                <FileText className="mt-0.5 size-4 text-muted-foreground" />
                <span>
                  <span className="block font-medium">{article.title}</span>
                  {article.excerpt ? (
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {article.excerpt}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="text-base">FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryFaqs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无 FAQ
              </div>
            ) : null}
            {categoryFaqs.map((faq) => (
              <div
                className="scroll-mt-24 rounded-md border border-border p-3"
                id={`faq-${faq.id}`}
                key={faq.id}
              >
                <div className="font-medium">{faq.question}</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DocsShell>
  );
}
