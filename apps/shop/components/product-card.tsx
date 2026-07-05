import type { ShopAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({ account }: { account: ShopAccount }) {
  const name = `[${account.serialNumber}]${account.title}`;

  return (
    <Link href={`/codm-account-info?id=${account.id}`}>
      <Card className="overflow-hidden transition-transform active:scale-[0.98]">
        <div className="relative aspect-square bg-muted">
          {account.images[0] ? (
            <Image
              fill
              className="object-cover"
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
        </div>
        <CardContent className="space-y-2 p-3">
          <div className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
            {name}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-xl font-extrabold text-price">
              <span className="mr-0.5 text-sm">¥</span>
              {account.price}
            </div>
            <Badge variant="secondary">上架</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
