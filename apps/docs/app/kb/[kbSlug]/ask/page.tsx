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
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">AI 问答</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            AI 会检索帮助中心内容后回答。订单、支付、隐私、库存和售后争议问题会引导人工处理。
          </p>
        </div>
        <Alert>
          <AlertTitle>回答范围</AlertTitle>
          <AlertDescription>
            当前助手只基于已发布帮助内容回答，不会处理具体订单或账号隐私信息。
          </AlertDescription>
        </Alert>
        <AskClient kbSlug={base.slug} />
      </div>
    </DocsShell>
  );
}
