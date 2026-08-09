import {
  getKnowledgeBaseBySlug,
  listFaqItems,
  listKnowledgeArticles,
  listKnowledgeCategories,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@wuliuqi/ui/components/accordion";
import { Button } from "@wuliuqi/ui/components/button";
import { Input } from "@wuliuqi/ui/components/input";
import { ArrowUpRight, Bot, FileText, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string }>;

const supportPath = [
  { label: "先查资料", detail: "从已发布内容开始" },
  { label: "再问助手", detail: "基于知识库继续定位" },
  { label: "找人工支持", detail: "订单与隐私交给人工" },
] as const;

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
  const publishedArticles = articles.filter(
    (article) => article.status === KNOWLEDGE_STATUS.published,
  );
  const publishedFaqs = faqs.filter(
    (faq) => faq.status === KNOWLEDGE_STATUS.published,
  );

  return (
    <DocsShell
      activeHref={`/kb/${base.slug}`}
      base={base}
      categories={categories}
      aside={<HomeAside kbSlug={base.slug} />}
    >
      <div className="space-y-12">
        <section className="grid overflow-hidden rounded-sm border border-line bg-surface md:grid-cols-[minmax(0,1fr)_176px]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
              <span className="size-1.5 bg-brand" />
              Buyer help desk
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
              有问题，先在这里找答案。
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-muted">
              从购买、交付到登录、换绑和售后，先查阅已发布帮助内容；找不到时，再让
              AI 助手帮你定位。
            </p>
            <form className="mt-7 flex flex-col gap-2 sm:flex-row" action="/search">
              <input name="kbSlug" type="hidden" value={base.slug} />
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                />
                <Input
                  aria-label="搜索帮助内容"
                  className="h-11 rounded-sm border-line bg-canvas pl-10 shadow-none focus-visible:ring-brand"
                  name="q"
                  placeholder="搜索登录、发货、换绑、售后…"
                />
              </div>
              <Button
                className="docs-primary-action h-11 rounded-sm px-5"
                type="submit"
              >
                搜索答案
              </Button>
            </form>
            <Button
              asChild
              className="mt-3 h-auto rounded-none px-0 text-ink-muted hover:bg-transparent hover:text-brand"
              variant="ghost"
            >
              <Link href={`/kb/${base.slug}/ask`}>
                <Bot size={16} />
                没找到？询问 567 助手
                <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="relative hidden border-l border-line bg-brand-soft p-5 md:grid md:grid-rows-[auto_1fr_auto]">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-strong dark:text-brand">
              Support / 567
            </span>
            <ol className="my-auto py-7">
              {supportPath.map((step, index) => (
                <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2" key={step.label}>
                  <div className="flex flex-col items-center">
                    <span className="grid size-6 place-items-center border border-brand bg-surface font-mono text-[9px] font-black text-brand-strong dark:text-brand">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {index < supportPath.length - 1 ? (
                      <span className="h-9 w-px bg-brand/50" />
                    ) : null}
                  </div>
                  <div className={index < supportPath.length - 1 ? "pb-4" : undefined}>
                    <p className="text-xs font-bold leading-6">{step.label}</p>
                    <p className="text-[10px] leading-4 text-ink-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="border-t border-brand/40 pt-3 font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.14em] text-brand-strong dark:text-brand">
              Public knowledge
              <br />
              comes first
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Browse by topic"
            meta={`${categories.length} 个分类`}
            title="按问题类型浏览"
          />
          <div className="mt-5 border-t-2 border-ink">
            {categories.length === 0 ? (
              <div className="border-b border-line py-10 text-sm text-ink-muted">
                暂无帮助分类。
              </div>
            ) : null}
            {categories.map((category, index) => (
              <Link
                className="group grid gap-2 border-b border-line py-4 transition-colors hover:bg-brand-soft/60 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-2"
                href={`/kb/${base.slug}/categories/${category.slug}`}
                key={category.id}
              >
                <span className="font-mono text-xs text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{category.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-ink-muted">
                    {category.description || "查看该分类下的帮助内容。"}
                  </span>
                </span>
                <ArrowUpRight className="hidden size-4 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeading eyebrow="Start here" title="推荐文章" />
            <div className="mt-5 border-t-2 border-ink">
              {publishedArticles.length === 0 ? (
                <div className="border-b border-line py-10 text-sm text-ink-muted">
                  暂无推荐文章。
                </div>
              ) : null}
              {publishedArticles.slice(0, 6).map((article) => (
                <Link
                  className="group flex items-start gap-3 border-b border-line py-3.5 transition-colors hover:bg-brand-soft/60 sm:px-2"
                  href={`/kb/${base.slug}/docs/${article.slug}`}
                  key={article.id}
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                      {article.title}
                    </span>
                    {article.excerpt ? (
                      <span className="mt-1 line-clamp-1 text-xs text-ink-muted">
                        {article.excerpt}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Quick answers" title="热门 FAQ" />
            <div className="mt-5 border-t-2 border-ink">
              {publishedFaqs.length === 0 ? (
                <div className="border-b border-line py-10 text-sm text-ink-muted">
                  暂无常见问题。
                </div>
              ) : null}
              <Accordion type="single" collapsible>
                {publishedFaqs.slice(0, 6).map((faq) => (
                  <AccordionItem
                    className="scroll-mt-24 border-line"
                    id={`faq-${faq.id}`}
                    key={faq.id}
                    value={faq.id}
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold hover:text-brand hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-ink-muted">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </div>
    </DocsShell>
  );
}

function HomeAside({ kbSlug }: { kbSlug: string }) {
  return (
    <div className="sticky top-24 border-t-2 border-ink pt-4">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
        567 Assistant
      </span>
      <h2 className="mt-3 text-lg font-bold">资料里没找到？</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        让 AI 根据已发布帮助内容继续定位，但不要发送订单号或账号隐私。
      </p>
      <Button asChild className="docs-primary-action mt-4 w-full rounded-sm">
        <Link href={`/kb/${kbSlug}/ask`}>
          <Bot size={16} />
          开始提问
        </Link>
      </Button>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight">{title}</h2>
      </div>
      {meta ? <span className="text-xs text-ink-muted">{meta}</span> : null}
    </div>
  );
}
