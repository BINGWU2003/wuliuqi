import { HomeAccountFeed } from "@/components/home-account-feed";
import { HomeCarousel } from "@/components/home-carousel";
import { ChevronRight, Gamepad2, Swords } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function Home() {
  return (
    <main className="flex flex-col gap-5">
      <HomeCarousel />
      <section
        aria-label="游戏快捷入口"
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3"
      >
        <GameShortcut
          accentClassName="bg-orange-500 text-white"
          description="使命召唤手游"
          href="/codm-account-page"
          icon={<Gamepad2 size={22} />}
          title="CODM"
        />
        <GameShortcut
          accentClassName="bg-red-600 text-white"
          description="武将皮肤账号"
          href="/sanguosha-account-page"
          icon={<Swords size={22} />}
          title="三国杀"
        />
      </section>
      <HomeAccountFeed />
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
      className="group flex min-h-20 items-center gap-3 rounded-md border border-border bg-card p-3 shadow-xs transition-colors hover:border-foreground/30"
      href={href}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-md ${accentClassName}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
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
