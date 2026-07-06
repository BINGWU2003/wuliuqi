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
    <nav className="space-y-1 text-sm">
      <DocsNavLink
        active={activeHref === homeHref}
        className="font-medium"
        href={homeHref}
      >
        帮助中心首页
      </DocsNavLink>
      {categories.map((category) => {
        const href = `/kb/${baseSlug}/categories/${category.slug}`;

        return (
          <DocsNavLink
            active={activeHref === href}
            href={href}
            key={category.id}
          >
            {category.name}
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
        "block rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-foreground",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
