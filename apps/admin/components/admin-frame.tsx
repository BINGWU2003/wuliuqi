"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  GalleryHorizontalEnd,
  Hash,
  LogOut,
  Mail,
  PackageSearch,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { logout } from "../lib/client-api";

const navItems = [
  { href: "/accounts", label: "账号", icon: PackageSearch },
  { href: "/emails", label: "邮箱", icon: Mail },
  { href: "/carousels/home_ads", label: "轮播", icon: GalleryHorizontalEnd },
  { href: "/sequence-counters", label: "计数器", icon: Hash },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
          <Link className="flex items-center gap-2 font-bold" href="/accounts">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
              567
            </span>
            <span className="hidden sm:inline">五六七管理端</span>
          </Link>
          <nav
            aria-label="管理导航"
            className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/accounts" && pathname.startsWith(item.href)) ||
                (item.href === "/accounts" && pathname.startsWith("/accounts"));

              return (
                <Link
                  key={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent text-foreground",
                  )}
                  href={item.href}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              aria-label="退出登录"
              size="icon"
              type="button"
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
