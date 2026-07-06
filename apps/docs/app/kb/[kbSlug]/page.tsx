import {
  getKnowledgeBaseBySlug,
  listFaqItems,
  listKnowledgeArticles,
  listKnowledgeCategories,
} from "@wuliuqi/rag-db";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@wuliuqi/ui/components/accordion";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wuliuqi/ui/components/card";
import { Bot, FileText, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string }>;

export default async function KnowledgeHome({
  params,
}: {
  params: Params;
}) {
  const { kbSlug } = await params;
  const base = await getKnowledgeBaseBySlug(kbSlug);

  if (!base) {
    notFound();
  }

  const [categories, articles, faqs] = await Promise.all([
    listKnowledgeCategories(base.id),
    listKnowledgeArticles(base.id),
    listFaqItems(base.id),
  ]);
  const publishedArticles = articles.filter((article) => article.status === "published");
  const publishedFaqs = faqs.filter((faq) => faq.status === "published");

  return (
    <DocsShell
      activeHref={`/kb/${base.slug}`}
      base={base}
      categories={categories}
      aside={<HomeAside kbSlug={base.slug} />}
    >
      <div className="space-y-6">
        <section className="rounded-md border border-border bg-card p-5 sm:p-6">
          <Badge variant="secondary">买家帮助中心</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-normal">
            有问题先在这里找答案
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            覆盖账号购买、交付、登录、绑定换绑、售后规则和基础安全提醒。AI
            助手会基于已发布内容回答，涉及订单和隐私的问题会引导人工处理。
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/kb/${base.slug}/ask`}>
                <Bot size={16} />
                问 AI 助手
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">
                <Search size={16} />
                搜索帮助内容
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-accent"
              href={`/kb/${base.slug}/categories/${category.slug}`}
              key={category.id}
            >
              <div className="font-semibold">{category.name}</div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {category.description || "查看该分类下的帮助内容。"}
              </p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">推荐文章</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {publishedArticles.slice(0, 6).map((article) => (
                <Link
                  className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent"
                  href={`/kb/${base.slug}/docs/${article.slug}`}
                  key={article.id}
                >
                  <FileText className="mt-0.5 size-4 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {article.title}
                    </span>
                    {article.excerpt ? (
                      <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
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
              <CardTitle className="text-base">热门 FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {publishedFaqs.slice(0, 6).map((faq) => (
                  <AccordionItem
                    className="scroll-mt-24"
                    id={`faq-${faq.id}`}
                    key={faq.id}
                    value={faq.id}
                  >
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </DocsShell>
  );
}

function HomeAside({ kbSlug }: { kbSlug: string }) {
  return (
    <div className="sticky top-20 space-y-3">
      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle className="text-base">AI 助手</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>适合询问购买流程、发货、登录、绑定和售后规则。</p>
          <Button asChild className="w-full">
            <Link href={`/kb/${kbSlug}/ask`}>开始提问</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
