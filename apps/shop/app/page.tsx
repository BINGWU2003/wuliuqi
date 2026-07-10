import { HomeAccountFeed } from "@/components/home-account-feed";
import { HomeCarousel } from "@/components/home-carousel";
import {
  gameListHref,
  homeFilterSearchParams,
  parseHomeFilterState,
} from "@/lib/shop-filters";
import type { ShopSearchParams } from "@/lib/shop-filters";
import { GAME_KEY } from "@wuliuqi/types";
import { ChevronRight, Gamepad2, Swords } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const initialFilters = parseHomeFilterState(await searchParams);

  return (
    <main className="flex flex-col gap-4 sm:gap-5">
      <HomeCarousel />
      <section
        aria-label="游戏快捷入口"
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3"
      >
        <GameShortcut
          accentClassName="bg-orange-500 text-white"
          description="使命召唤手游"
          href={gameListHref(GAME_KEY.codm, initialFilters)}
          icon={<Gamepad2 size={22} />}
          title="CODM"
        />
        <GameShortcut
          accentClassName="bg-red-600 text-white"
          description="武将皮肤账号"
          href={gameListHref(GAME_KEY.sanguosha, initialFilters)}
          icon={<Swords size={22} />}
          title="三国杀"
        />
      </section>
      <HomeAccountFeed
        key={homeFilterSearchParams(initialFilters).toString()}
        initialFilters={initialFilters}
      />
    </main>
  );
}

function GameShortcut({
  accentClassName,
  description,
  href,
  icon,
  title,
}: {
  accentClassName: string;
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Link
      className="group flex min-h-16 items-center gap-2.5 rounded-md border border-border bg-card p-2.5 shadow-xs transition-colors hover:border-foreground/30 sm:min-h-20 sm:gap-3 sm:p-3"
      href={href}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-md sm:size-11 ${accentClassName}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
          {description}
        </span>
      </span>
      <ChevronRight
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        size={18}
      />
    </Link>
  );
}
