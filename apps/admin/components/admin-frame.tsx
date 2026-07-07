"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import { ThemeToggle } from "@wuliuqi/ui/components/theme-toggle";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  Library,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems = [
  { href: "/accounts", label: "账号", icon: PackageSearch },
  { href: "/attribute-definitions", label: "属性", icon: SlidersHorizontal },
  { href: "/emails", label: "邮箱", icon: Mail },
  { href: "/system", label: "系统", icon: Settings },
  { href: "/knowledge", label: "知识库", icon: Library },
] satisfies [NavItem, ...NavItem[]];

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const activeNavItem =
    navItems.find((item) => isNavActive(pathname, item.href)) ?? navItems[0];

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      toast.error(errorMessage(logoutError, "退出登录失败"));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[48px_1fr_88px] items-center gap-2 px-3 sm:flex sm:h-16 sm:justify-between sm:gap-3 sm:px-6">
          <Link className="flex items-center gap-2 font-bold" href="/accounts">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-xs text-primary-foreground">
              567
            </span>
            <span className="hidden sm:inline">五六七管理端</span>
          </Link>
          <div className="truncate text-center text-[15px] font-bold sm:hidden">
            {activeNavItem.label}
          </div>
          <nav
            aria-label="管理导航"
            className="hidden min-w-0 flex-1 justify-center gap-1 overflow-x-auto sm:flex"
          >
            {navItems.map((item) => {
              return (
                <TopNavLink
                  active={isNavActive(pathname, item.href)}
                  icon={item.icon}
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                </TopNavLink>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-1">
            <ThemeToggle storageKey="wuliuqi-admin-theme" />
            <Button
              aria-label="退出登录"
              disabled={loggingOut}
              size="icon"
              title={loggingOut ? "退出中..." : "退出登录"}
              type="button"
              variant="ghost"
              onClick={handleLogout}
            >
              {loggingOut ? <Spinner /> : <LogOut size={18} />}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-6">
        {children}
      </main>
      <nav
        aria-label="底部管理导航"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden"
      >
        {navItems.map((item) => (
          <BottomTabLink
            active={isNavActive(pathname, item.href)}
            icon={item.icon}
            key={item.href}
            href={item.href}
          >
            {item.label}
          </BottomTabLink>
        ))}
      </nav>
    </div>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === "/accounts") {
    return pathname.startsWith("/accounts");
  }

  if (href === "/system") {
    return (
      pathname.startsWith("/system") ||
      pathname.startsWith("/carousels") ||
      pathname.startsWith("/sequence-counters")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function TopNavLink({
  active,
  children,
  href,
  icon: Icon,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  icon: NavItem["icon"];
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
      href={href}
    >
      <Icon size={16} />
      <span>{children}</span>
    </Link>
  );
}

function BottomTabLink({
  active,
  children,
  href,
  icon: Icon,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  icon: NavItem["icon"];
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-colors",
        active && "text-primary",
      )}
      href={href}
    >
      {active ? (
        <span className="absolute top-1 h-1 w-6 rounded-full bg-primary" />
      ) : null}
      <Icon size={20} />
      <span className="max-w-full truncate px-1">{children}</span>
    </Link>
  );
}
