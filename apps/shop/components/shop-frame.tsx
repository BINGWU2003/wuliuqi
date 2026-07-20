"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { ThemeToggle } from "@wuliuqi/ui/components/theme-toggle";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Coins,
  Gamepad2,
  Home,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ContactOptionsButton } from "@/components/contact-options-button";

const titleMap: Record<string, string> = {
  "/": "567手游店",
  "/account-section": "账号专区",
  "/codm-account-page": "CODM 账号列表",
  "/codm-account-info": "CODM 账号详情",
  "/sanguosha-account-page": "三国杀账号列表",
  "/sanguosha-account-info": "三国杀账号详情",
  "/recharge-section": "充值专区",
  "/guide": "指南",
};

const accountTabPaths = [
  "/account-section",
  "/codm-account-page",
  "/sanguosha-account-page",
];
const rechargeTabPaths = ["/recharge-section"];
const accountDetailPaths = ["/codm-account-info", "/sanguosha-account-info"];
const tabPaths = ["/", ...accountTabPaths, ...rechargeTabPaths, "/guide"];

export function ShopFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = titleMap[pathname] ?? "567手游店";
  const accountTabActive = accountTabPaths.includes(pathname);
  const rechargeTabActive = rechargeTabPaths.includes(pathname);
  const showBack = !tabPaths.includes(pathname);
  const showTabs = tabPaths.includes(pathname);
  const showFloatingContact = !accountDetailPaths.includes(pathname);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[48px_1fr_48px] items-center px-2 sm:h-16 sm:grid-cols-[auto_1fr_auto] sm:px-6">
          <div className="flex items-center gap-2">
            {showBack ? (
              <Button
                aria-label="返回"
                size="icon"
                title="返回"
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                <ArrowLeft size={21} />
              </Button>
            ) : (
              <Link
                className="hidden items-center gap-2 text-sm font-bold sm:flex"
                href="/"
              >
                <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                  567
                </span>
                五六七手游店
              </Link>
            )}
          </div>
          <div className="truncate text-center text-[15px] font-bold sm:hidden">
            {title}
          </div>
          <nav
            className="hidden justify-center gap-1 sm:flex"
            aria-label="主导航"
          >
            <TopLink active={pathname === "/"} href="/">
              首页
            </TopLink>
            <TopLink active={accountTabActive} href="/account-section">
              账号专区
            </TopLink>
            <TopLink active={rechargeTabActive} href="/recharge-section">
              充值专区
            </TopLink>
            <TopLink active={pathname === "/guide"} href="/guide">
              指南
            </TopLink>
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck size={15} />
              闲鱼担保交易
            </div>
            <ThemeToggle storageKey="wuliuqi-shop-theme" />
          </div>
          <div className="flex justify-end sm:hidden">
            <ThemeToggle storageKey="wuliuqi-shop-theme" />
          </div>
        </div>
      </header>
      <div className="min-h-screen px-3 pb-20 pt-[68px] sm:px-6 sm:pt-20">
        {children}
      </div>
      {showFloatingContact ? (
        <ContactOptionsButton avoidBottomTabs={showTabs} variant="floating" />
      ) : null}
      {showTabs ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-border bg-card/95 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden"
          aria-label="底部导航"
        >
          <TabLink active={pathname === "/"} href="/" icon={<Home size={21} />}>
            首页
          </TabLink>
          <TabLink
            active={accountTabActive}
            href="/account-section"
            icon={<Gamepad2 size={21} />}
          >
            账号专区
          </TabLink>
          <TabLink
            active={rechargeTabActive}
            href="/recharge-section"
            icon={<Coins size={21} />}
          >
            充值专区
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

function TopLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
      href={href}
    >
      {children}
    </Link>
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground transition-colors",
        active && "text-primary",
      )}
      href={href}
    >
      {active ? (
        <span className="absolute top-1 h-1 w-6 rounded-full bg-primary" />
      ) : null}
      {icon}
      <span>{children}</span>
    </Link>
  );
}
