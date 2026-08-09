import type { KnowledgeBase, KnowledgeCategory } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wuliuqi/ui/components/sheet";
import { ThemeToggle } from "@wuliuqi/ui/components/theme-toggle";
import { cn } from "@wuliuqi/ui/lib/utils";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AskWidget } from "./ask-widget";
import { DocsNav } from "./docs-nav";

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
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="打开帮助目录"
                className="rounded-sm border border-line bg-transparent lg:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-line bg-surface" side="left">
              <SheetHeader>
                <SheetTitle className="text-left">{base.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-8">{nav}</div>
            </SheetContent>
          </Sheet>
          <Link
            className="group flex items-center gap-3"
            href={`/kb/${base.slug}`}
          >
            <span className="docs-brand-mark grid size-9 place-items-center rounded-sm border-2 border-ink bg-brand font-mono text-xs font-black text-white transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#21110b]">
              567
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-bold tracking-tight">五六七手游店</span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Buyer support
              </span>
            </span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <Button
              asChild
              className="rounded-sm border-line bg-transparent px-3 hover:bg-brand-soft hover:text-ink"
              size="sm"
              variant="outline"
            >
              <Link aria-label="搜索帮助内容" href={`/search?kbSlug=${base.slug}`}>
                <Search size={16} />
                <span className="hidden sm:inline">搜索帮助</span>
              </Link>
            </Button>
            <ThemeToggle storageKey="wuliuqi-docs-theme" />
          </div>
        </div>
      </header>
      <div
        className={cn(
          "mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[208px_minmax(0,1fr)] lg:px-8 lg:py-8",
          aside && "xl:grid-cols-[208px_minmax(0,1fr)_240px]",
        )}
      >
        <aside className="sticky top-24 hidden h-[calc(100dvh-7rem)] overflow-auto lg:block">
          {nav}
        </aside>
        <main className={cn("min-w-0", !aside && "max-w-5xl")}>{children}</main>
        {aside ? (
          <aside className="hidden min-w-0 xl:block">{aside}</aside>
        ) : null}
      </div>
      <AskWidget kbSlug={base.slug} />
    </div>
  );
}
