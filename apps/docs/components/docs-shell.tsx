import type { KnowledgeBase, KnowledgeCategory } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wuliuqi/ui/components/sheet";
import { Bot, Menu, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocsNav } from "./docs-nav";
import { ThemeToggle } from "./theme-toggle";

export function DocsShell({
  base,
  categories,
  children,
  activeHref,
  aside,
}: {
  base: KnowledgeBase;
  categories: KnowledgeCategory[];
  children: ReactNode;
  activeHref?: string;
  aside?: ReactNode;
}) {
  const nav = (
    <DocsNav
      activeHref={activeHref}
      baseSlug={base.slug}
      categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden" size="icon" variant="ghost">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>{base.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{nav}</div>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center gap-2 font-bold" href={`/kb/${base.slug}`}>
            <span className="grid size-8 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
              567
            </span>
            <span className="hidden sm:inline">{base.name}</span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <Button asChild className="hidden sm:inline-flex" variant="outline">
              <Link href="/search">
                <Search size={16} />
                搜索
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/kb/${base.slug}/ask`}>
                <Bot size={16} />
                AI 问答
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-3 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_260px] lg:py-6">
        <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] overflow-auto lg:block">
          {nav}
        </aside>
        <main className="min-w-0">{children}</main>
        <aside className="hidden min-w-0 lg:block">{aside}</aside>
      </div>
    </div>
  );
}
