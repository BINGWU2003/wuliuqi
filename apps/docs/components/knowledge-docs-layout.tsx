import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import type { DocsContext } from "@/lib/docs";
import { AskWidget } from "./ask-widget";

export function KnowledgeDocsLayout({
  children,
  context,
}: {
  children: ReactNode;
  context: DocsContext;
}) {
  return (
    <DocsLayout
      links={[
        {
          type: "main",
          text: "AI 助手",
          url: `/kb/${context.base.slug}/ask`,
          active: "url",
        },
      ]}
      nav={{
        title: "五六七手游店 · 帮助中心",
        url: `/kb/${context.base.slug}`,
      }}
      tree={context.tree}
    >
      {children}
      <AskWidget kbSlug={context.base.slug} />
    </DocsLayout>
  );
}
