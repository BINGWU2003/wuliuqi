import type { ShopAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { Camera, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getAccountBadges,
  getAccountName,
  getStatusLabel,
} from "../lib/account-display";

export function ProductCard({ account }: { account: ShopAccount }) {
  const name = getAccountName(account);
  const badges = getAccountBadges(account);

  return (
    <Link className="group block" href={`/codm-account-info?id=${account.id}`}>
      <Card className="h-full overflow-hidden rounded-md border-border/80 bg-card shadow-none transition-colors hover:border-foreground/30">
        <div className="relative aspect-[4/3] bg-muted">
          {account.images[0] ? (
            <Image
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 720px) 300px, 50vw"
              src={account.images[0]}
              alt={name}
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              暂无图片
            </div>
          )}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
            <Camera size={13} />
            {account.images.length}
          </div>
        </div>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-muted-foreground">
                {account.serialNumber}
              </div>
              <div className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
                {account.title}
              </div>
            </div>
            <Badge
              className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300"
              variant="outline"
            >
              {getStatusLabel(account.status)}
            </Badge>
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  className="rounded-sm px-1.5 font-normal"
                  variant="secondary"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="flex items-end justify-between gap-2 border-t border-border pt-3">
            <div>
              <div className="text-[11px] font-medium uppercase text-muted-foreground">
                Ask price
              </div>
              <div className="font-mono text-xl font-bold text-price">
                {formatPrice(account.price)}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck size={14} />
              资料卡
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
