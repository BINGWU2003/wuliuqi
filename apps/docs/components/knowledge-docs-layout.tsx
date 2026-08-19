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
      nav={{
        title: "五六七手游店 · 帮助中心",
        url: `/kb/${context.base.slug}`,
      }}
      tree={context.tree}
    >
      <AskWidget kbSlug={context.base.slug} />
      {children}
    </DocsLayout>
  );
}
