import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Callout } from "fumadocs-ui/components/callout";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { AskClient } from "@/components/ask-client";
import { getDocsContext } from "@/lib/docs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI 帮助助手",
  description: "基于已发布帮助内容回答买家常见问题。",
};

type Params = Promise<{ kbSlug: string }>;

export default async function AskPage({ params }: { params: Params }) {
  const { kbSlug } = await params;
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  return (
    <DocsPage footer={{ enabled: false }} tableOfContent={{ enabled: false }}>
      <DocsTitle>询问 AI 帮助助手</DocsTitle>
      <DocsDescription>
        助手会先检索已发布的帮助内容，再组织答案。订单、支付、隐私和售后争议仍由人工处理。
      </DocsDescription>
      <DocsBody>
        <Callout className="my-6" title="先保护你的账号信息" type="warn">
          不要发送订单号、密码、验证码或其他隐私信息；助手只回答公开帮助内容。
        </Callout>
        <div className="not-prose">
          <AskClient kbSlug={context.base.slug} />
        </div>
      </DocsBody>
    </DocsPage>
  );
}
