import { listFaqItems } from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Card, Cards } from "fumadocs-ui/components/card";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { getDocsContext } from "@/lib/docs";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string; categorySlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { kbSlug, categorySlug } = await params;
  const context = await getDocsContext(kbSlug);
  const category = context?.categories.find(
    (item) => item.slug === categorySlug,
  );

  return category
    ? { title: category.name, description: category.description }
    : { title: "帮助分类" };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { kbSlug, categorySlug } = await params;
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  const category = context.categories.find(
    (item) => item.slug === categorySlug,
  );

  if (!category) {
    notFound();
  }

  const faqs = await listFaqItems(context.base.id);
  const articles = context.articles.filter(
    (article) => article.categoryId === category.id,
  );
  const categoryFaqs = faqs.filter(
    (faq) =>
      faq.status === KNOWLEDGE_STATUS.published &&
      faq.categoryId === category.id,
  );

  return (
    <DocsPage footer={{ enabled: false }} tableOfContent={{ enabled: false }}>
      <DocsTitle>{category.name}</DocsTitle>
      <DocsDescription>{category.description}</DocsDescription>
      <DocsBody>
        <section className="not-prose my-8">
          <h2 className="mb-4 text-xl font-semibold">帮助文章</h2>
          {articles.length > 0 ? (
            <Cards>
              {articles.map((article) => (
                <Card
                  description={article.excerpt}
                  href={`/kb/${context.base.slug}/docs/${article.slug}`}
                  icon={<FileText />}
                  key={article.id}
                  title={article.title}
                />
              ))}
            </Cards>
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-fd-muted-foreground">
              这个分类暂时没有已发布文章。
            </p>
          )}
        </section>

        <section className="not-prose my-10">
          <h2 className="mb-4 text-xl font-semibold">常见问题</h2>
          {categoryFaqs.length > 0 ? (
            <Accordions type="single">
              {categoryFaqs.map((faq) => (
                <Accordion
                  id={`faq-${faq.id}`}
                  key={faq.id}
                  title={faq.question}
                >
                  <p>{faq.answer}</p>
                </Accordion>
              ))}
            </Accordions>
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-fd-muted-foreground">
              这个分类暂时没有常见问题。
            </p>
          )}
        </section>
      </DocsBody>
    </DocsPage>
  );
}
