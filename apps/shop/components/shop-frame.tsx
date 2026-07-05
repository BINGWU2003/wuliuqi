"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ArrowLeft, BookOpen, Gamepad2, Home } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const titleMap: Record<string, string> = {
  "/": "567手游店",
  "/account-section": "账号专区",
  "/codm-account-page": "CODM 账号列表",
  "/codm-account-info": "CODM 账号详情",
  "/guide": "指南",
};

const rootPaths = ["/", "/account-section", "/guide"];

export function ShopFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = titleMap[pathname] ?? "567手游店";
  const showBack = !rootPaths.includes(pathname);
  const showTabs = rootPaths.includes(pathname);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 grid h-[52px] grid-cols-[48px_1fr_48px] items-center border-b border-border bg-card/95 shadow-sm backdrop-blur">
        <div>
          {showBack ? (
            <Button
              aria-label="返回"
              className="ml-1"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft size={22} />
            </Button>
          ) : null}
        </div>
        <div className="truncate text-center text-[17px] font-bold">
          {title}
        </div>
        <div />
      </header>
      <div className="min-h-screen px-3 pb-20 pt-16 sm:px-6">{children}</div>
      {showTabs ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-3 border-t border-border bg-card/95 shadow-[0_-8px_24px_rgba(20,35,65,0.07)] backdrop-blur"
          aria-label="底部导航"
        >
          <TabLink active={pathname === "/"} href="/" icon={<Home size={21} />}>
            首页
          </TabLink>
          <TabLink
            active={pathname === "/account-section"}
            href="/account-section"
            icon={<Gamepad2 size={21} />}
          >
            账号专区
          </TabLink>
          <TabLink
            active={pathname === "/guide"}
            href="/guide"
            icon={<BookOpen size={21} />}
          >
            指南
          </TabLink>
        </nav>
      ) : null}
    </>
  );
}

function TabLink({
  active,
  children,
  href,
  icon,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-colors",
        active && "text-primary",
      )}
      href={href}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
