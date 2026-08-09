import {
  getKnowledgeBaseBySlug,
  listFaqItems,
  listKnowledgeCategories,
  listPublishedArticlesByCategory,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { ArrowUpRight, FileText } from "lucide-react";
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
      <div className="space-y-10">
        <header className="border-b border-line pb-8">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
            <span className="h-px w-5 bg-brand" />
            Help category
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-muted">
              {category.description}
            </p>
          ) : null}
        </header>

        <section>
          <SectionTitle count={articles.length} label="Guides" title="帮助文章" />
          <div className="mt-5 border-t-2 border-ink">
            {articles.length === 0 ? (
              <div className="border-b border-line py-10 text-sm text-ink-muted">
                这个分类暂时没有已发布文章。
              </div>
            ) : null}
            {articles.map((article, index) => (
              <Link
                className="group grid gap-2 border-b border-line py-4 transition-colors hover:bg-brand-soft/60 sm:grid-cols-[2.5rem_1.25rem_minmax(0,1fr)_auto] sm:items-start sm:px-2"
                href={`/kb/${base.slug}/docs/${article.slug}`}
                key={article.id}
              >
                <span className="font-mono text-[11px] text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <FileText className="mt-0.5 hidden size-4 text-brand sm:block" />
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                    {article.title}
                  </span>
                  {article.excerpt ? (
                    <span className="mt-1 block text-sm leading-6 text-ink-muted">
                      {article.excerpt}
                    </span>
                  ) : null}
                </span>
                <ArrowUpRight className="hidden size-4 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle count={categoryFaqs.length} label="Quick answers" title="常见问题" />
          <div className="mt-5 border-t-2 border-ink">
            {categoryFaqs.length === 0 ? (
              <div className="border-b border-line py-10 text-sm text-ink-muted">
                这个分类暂时没有常见问题。
              </div>
            ) : null}
            {categoryFaqs.map((faq, index) => (
              <div
                className="scroll-mt-24 grid gap-2 border-b border-line py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:px-2"
                id={`faq-${faq.id}`}
                key={faq.id}
              >
                <span className="font-mono text-[11px] text-brand">
                  Q{String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DocsShell>
  );
}

function SectionTitle({
  count,
  label,
  title,
}: {
  count: number;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
          {label}
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight">{title}</h2>
      </div>
      <span className="font-mono text-xs text-ink-muted">
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}
