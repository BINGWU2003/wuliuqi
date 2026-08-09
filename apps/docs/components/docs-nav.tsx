import type { KnowledgeCategory } from "@wuliuqi/types";
import { cn } from "@wuliuqi/ui/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

type DocsNavCategory = Pick<KnowledgeCategory, "id" | "name" | "slug">;

export function DocsNav({
  activeHref,
  baseSlug,
  categories,
}: {
  activeHref?: string;
  baseSlug: string;
  categories: DocsNavCategory[];
}) {
  const homeHref = `/kb/${baseSlug}`;

  return (
    <nav className="text-sm">
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        <span className="h-px w-5 bg-brand" />
        Help index
      </div>
      <DocsNavLink
        active={activeHref === homeHref}
        className="font-semibold"
        href={homeHref}
      >
        帮助中心首页
      </DocsNavLink>
      <div className="my-3 border-t border-line" />
      {categories.map((category, index) => {
        const href = `/kb/${baseSlug}/categories/${category.slug}`;

        return (
          <DocsNavLink
            active={activeHref === href}
            href={href}
            key={category.id}
          >
            <span className="font-mono text-[10px] text-ink-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{category.name}</span>
          </DocsNavLink>
        );
      })}
    </nav>
  );
}

function DocsNavLink({
  active,
  children,
  className,
  href,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-9 items-center gap-3 rounded-sm px-2.5 py-2 transition-colors hover:bg-brand-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "bg-brand-soft font-medium text-ink before:absolute before:-left-px before:h-5 before:w-0.5 before:bg-brand"
          : "text-ink-muted",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
