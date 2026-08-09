import {
  getKnowledgeBaseBySlug,
  listKnowledgeCategories,
} from "@wuliuqi/rag-db";
import { Alert, AlertDescription, AlertTitle } from "@wuliuqi/ui/components/alert";
import { notFound } from "next/navigation";
import { AskClient } from "@/components/ask-client";
import { DocsShell } from "@/components/docs-shell";

export const dynamic = "force-dynamic";

type Params = Promise<{ kbSlug: string }>;

export default async function AskPage({ params }: { params: Params }) {
  const { kbSlug } = await params;
  const base = await getKnowledgeBaseBySlug(kbSlug);

  if (!base) {
    notFound();
  }

  const categories = await listKnowledgeCategories(base.id);

  return (
    <DocsShell base={base} categories={categories}>
      <div className="space-y-6">
        <header className="border-b border-line pb-8">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-strong dark:text-brand">
            <span className="h-px w-5 bg-brand" />
            567 Assistant
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            询问帮助助手
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-muted">
            助手会先检索已发布帮助内容，再组织答案。订单、支付、隐私和售后争议仍由人工处理。
          </p>
        </header>
        <Alert className="rounded-sm border-line bg-brand-soft/60">
          <AlertTitle className="font-semibold">先保护你的账号信息</AlertTitle>
          <AlertDescription className="leading-6 text-ink-muted">
            不要发送订单号、密码、验证码或其他隐私信息；助手只回答公开帮助内容。
          </AlertDescription>
        </Alert>
        <AskClient kbSlug={base.slug} />
      </div>
    </DocsShell>
  );
}
