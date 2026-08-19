import { searchPublishedKnowledge } from "@wuliuqi/rag-db";
import { Bot, FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  PageLastUpdate,
} from "fumadocs-ui/layouts/docs/page";
import { AskAssistantTrigger } from "@/components/ask-widget";
import { getMarkdownToc, MarkdownContent } from "@/components/markdown-content";
import { getDocsContext } from "@/lib/docs";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string; docSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { kbSlug, docSlug } = await params;
  const context = await getDocsContext(kbSlug);
  const article = context?.articles.find((item) => item.slug === docSlug);

  return article
    ? { title: article.title, description: article.excerpt }
    : { title: "帮助文章" };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { kbSlug, docSlug } = await params;
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  const article = context.articles.find((item) => item.slug === docSlug);

  if (!article) {
    notFound();
  }

  const related = await searchPublishedKnowledge({
    knowledgeBaseSlug: context.base.slug,
    query: article.title,
    limit: 5,
  });
  const relatedArticles = related
    .filter(
      (item) => item.href !== `/kb/${context.base.slug}/docs/${article.slug}`,
    )
    .slice(0, 4);
  const toc = getMarkdownToc(article.content);

  return (
    <DocsPage tableOfContent={{ enabled: toc.length > 0 }} toc={toc}>
      <DocsTitle>{article.title}</DocsTitle>
      <DocsDescription>{article.excerpt}</DocsDescription>
      {article.updatedAt ? (
        <PageLastUpdate date={new Date(article.updatedAt)} />
      ) : null}
      <DocsBody>
        <Callout className="my-6" title="需要进一步确认？">
          你可以针对本文继续询问 AI
          助手；涉及订单、支付、隐私和售后争议的问题请联系人工。
        </Callout>

        <MarkdownContent content={article.content} />

        <div className="not-prose my-10 border-t pt-6">
          <AskAssistantTrigger
            className={buttonVariants({ color: "outline" })}
          >
            <Bot className="size-4" />
            针对本文提问
          </AskAssistantTrigger>
        </div>

        {relatedArticles.length > 0 ? (
          <section className="not-prose my-10">
            <h2 className="mb-4 text-xl font-semibold">相关内容</h2>
            <Cards>
              {relatedArticles.map((item) => (
                <Card
                  description={item.excerpt}
                  href={item.href}
                  icon={<FileText />}
                  key={`${item.type}-${item.id}`}
                  title={item.title}
                />
              ))}
            </Cards>
          </section>
        ) : null}
      </DocsBody>
    </DocsPage>
  );
}
