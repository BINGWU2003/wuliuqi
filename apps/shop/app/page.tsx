import { HomeAccountFeed } from "@/components/home-account-feed";
import { HomeCarousel } from "@/components/home-carousel";
import {
  gameListHref,
  homeFilterSearchParams,
  parseHomeFilterState,
} from "@/lib/shop-filters";
import type { ShopSearchParams } from "@/lib/shop-filters";
import { GAME_KEY } from "@wuliuqi/types";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const initialFilters = parseHomeFilterState(await searchParams);

  return (
    <main className="flex flex-col gap-5 sm:gap-6">
      <HomeCarousel />
      <TrustStrip />
      <section
        aria-label="游戏快捷入口"
        className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3"
      >
        <GameShortcut
          description="使命召唤手游"
          href={gameListHref(GAME_KEY.codm, initialFilters)}
          imageAlt="Call of Duty: Mobile 国际服官方图标"
          imageSrc="/game-icons/codm-global.png"
          title="CODM"
        />
        <GameShortcut
          description="武将皮肤账号"
          href={gameListHref(GAME_KEY.sanguosha, initialFilters)}
          imageAlt="三国杀官方图标"
          imageClassName="object-left"
          imageSrc="/game-icons/sanguosha.png"
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
  description,
  href,
  imageAlt,
  imageClassName,
  imageSrc,
  title,
}: {
  description: string;
  href: string;
  imageAlt: string;
  imageClassName?: string;
  imageSrc: string;
  title: string;
}) {
  return (
    <Link
      className="group flex min-h-20 items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md active:translate-y-0 sm:min-h-24 sm:p-4"
      href={href}
    >
      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 sm:size-12">
        <Image
          alt={imageAlt}
          className={`object-cover ${imageClassName ?? "object-center"}`}
          fill
          sizes="(min-width: 640px) 48px, 44px"
          src={imageSrc}
        />
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

const trustItems = [
  {
    description: "平台联系更安心",
    icon: <ShieldCheck size={18} />,
    title: "闲鱼担保交易",
  },
  {
    description: "多图展示账号内容",
    icon: <Camera size={18} />,
    title: "账号实拍截图",
  },
  {
    description: "编号与价格先确认",
    icon: <BadgeCheck size={18} />,
    title: "购买前可核验",
  },
  {
    description: "下单问题及时沟通",
    icon: <Headphones size={18} />,
    title: "售前咨询答疑",
  },
] as const;

function TrustStrip() {
  return (
    <section
      aria-label="交易保障"
      className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-3 gap-y-4 rounded-xl border border-border/80 bg-card px-3 py-4 shadow-xs sm:grid-cols-4 sm:px-4"
    >
      {trustItems.map((item) => (
        <div className="flex min-w-0 items-center gap-2.5" key={item.title}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold sm:text-sm">
              {item.title}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground sm:text-[11px]">
              {item.description}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
