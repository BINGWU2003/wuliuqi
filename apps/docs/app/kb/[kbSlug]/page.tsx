import { listFaqItems } from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { Bot, FileText, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordions, Accordion } from "fumadocs-ui/components/accordion";
import { Card, Cards } from "fumadocs-ui/components/card";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { getDocsContext } from "@/lib/docs";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { kbSlug } = await params;
  const context = await getDocsContext(kbSlug);

  return context
    ? { title: context.base.name, description: context.base.description }
    : { title: "帮助中心" };
}

export default async function KnowledgeHome({ params }: { params: Params }) {
  const { kbSlug } = await params;
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  const faqs = await listFaqItems(context.base.id);
  const publishedFaqs = faqs.filter(
    (faq) => faq.status === KNOWLEDGE_STATUS.published,
  );

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      full
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
    >
      <DocsTitle>有问题，先在这里找答案</DocsTitle>
      <DocsDescription>
        从购买、交付到登录、换绑和售后，先查阅已发布的帮助内容；找不到时，再让
        AI 助手帮你定位。
      </DocsDescription>

      <DocsBody>
        <form
          className="not-prose my-8 flex flex-col gap-2 sm:flex-row"
          action="/search"
        >
          <input name="kbSlug" type="hidden" value={context.base.slug} />
          <label className="relative flex-1">
            <span className="sr-only">搜索帮助内容</span>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border bg-fd-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-fd-muted-foreground focus:border-fd-ring"
              name="q"
              placeholder="搜索登录、发货、换绑、售后…"
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
          <h2 className="mb-4 text-xl font-semibold">按问题类型浏览</h2>
          {context.categories.length > 0 ? (
            <Cards>
              {context.categories.map((category) => (
                <Card
                  description={
                    category.description || "查看该分类下的帮助内容。"
                  }
                  href={`/kb/${context.base.slug}/categories/${category.slug}`}
                  key={category.id}
                  title={category.name}
                />
              ))}
            </Cards>
          ) : (
            <EmptyState>暂无帮助分类。</EmptyState>
          )}
        </section>

        <section className="not-prose my-10">
          <h2 className="mb-4 text-xl font-semibold">推荐文章</h2>
          {context.articles.length > 0 ? (
            <Cards>
              {context.articles.slice(0, 6).map((article) => (
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
            <EmptyState>暂无推荐文章。</EmptyState>
          )}
        </section>

        <section className="not-prose my-10">
          <h2 className="mb-4 text-xl font-semibold">热门常见问题</h2>
          {publishedFaqs.length > 0 ? (
            <Accordions type="single">
              {publishedFaqs.slice(0, 6).map((faq) => (
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
            <EmptyState>暂无常见问题。</EmptyState>
          )}
        </section>

        <section className="not-prose my-10 rounded-xl border bg-fd-card p-6 text-fd-card-foreground">
          <Bot className="mb-3 size-5" />
          <h2 className="text-lg font-semibold">资料里没找到？</h2>
          <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
            让 AI 根据已发布的帮助内容继续定位。请不要发送订单号、密码或验证码。
          </p>
          <Link
            className={`${buttonVariants({ color: "outline" })} mt-4`}
            href={`/kb/${context.base.slug}/ask`}
          >
            询问 AI 助手
          </Link>
        </section>
      </DocsBody>
    </DocsPage>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-fd-muted-foreground">
      {children}
    </div>
  );
}
