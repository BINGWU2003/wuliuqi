import { ACCOUNT_STATUS, GAME_KEY } from "@wuliuqi/types";
import type { PublicShopAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ArrowRight, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getAccountCardBadges,
  getAccountName,
  getStatusLabel,
} from "@/lib/account-display";

export function ProductCard({
  account,
  eager = false,
}: {
  account: PublicShopAccount;
  eager?: boolean;
}) {
  const name = getAccountName(account);
  const badges = getAccountCardBadges(account);
  const gameBadgeClassName =
    account.gameKey === GAME_KEY.sanguosha
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
      : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300";
  const detailPath =
    account.gameKey === GAME_KEY.sanguosha
      ? "/sanguosha-account-info"
      : "/codm-account-info";

  return (
    <Link
      id={`account-card-${account.id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href={`${detailPath}?id=${account.id}`}
      scroll={false}
      title={`查看账号详情：${account.serialNumber}`}
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-xl border-border/80 bg-card shadow-sm transition-[transform,border-color,box-shadow] group-hover:-translate-y-0.5 group-hover:border-foreground/30 group-hover:shadow-md">
        <div className="relative aspect-video bg-muted md:aspect-[4/3]">
          {account.images[0] ? (
            <Image
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 720px) 300px, 50vw"
              src={account.images[0]}
              alt={name}
              loading={eager ? "eager" : "lazy"}
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              暂无图片
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
            <Camera size={13} />
            {account.images.length}
          </div>
          {account.status !== ACCOUNT_STATUS.listed ? (
            <Badge
              className="absolute right-2.5 top-2.5 rounded-md shadow-sm backdrop-blur"
              variant="outline"
            >
              {getStatusLabel(account.status)}
            </Badge>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-3.5">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">
              {account.serialNumber}
            </div>
            <div className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
              {account.title}
            </div>
          </div>
          <div className="flex min-h-7 content-start flex-wrap gap-1.5">
            {badges.map((badge, index) => (
              <Badge
                key={badge}
                className={cn(
                  "rounded-md px-1.5 font-normal",
                  index === 0 && gameBadgeClassName,
                )}
                variant={index === 0 ? "outline" : "secondary"}
              >
                {badge}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3">
            <div>
              <div className="text-[11px] font-medium uppercase text-muted-foreground">
                售价
              </div>
              <div className="font-mono text-2xl font-bold tracking-tight text-price">
                {formatPrice(account.price)}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-foreground transition-transform group-hover:translate-x-0.5">
              查看详情
              <ArrowRight size={14} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
