import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { KnowledgeDocsLayout } from "@/components/knowledge-docs-layout";
import { getDocsContext } from "@/lib/docs";

type Params = Promise<{ kbSlug: string }>;

export default async function KnowledgeBaseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { kbSlug } = await params;
  const context = await getDocsContext(kbSlug);

  if (!context) {
    notFound();
  }

  return (
    <KnowledgeDocsLayout context={context}>{children}</KnowledgeDocsLayout>
  );
}
