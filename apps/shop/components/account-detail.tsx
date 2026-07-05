"use client";

import type { ShopAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { Separator } from "@wuliuqi/ui/components/separator";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hash,
  ShieldCheck,
  Store,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  formatDate,
  formatPrice,
  getAccountBadges,
  getStatusLabel,
} from "../lib/account-display";
import { fetchAccount } from "../lib/client-api";
import { ImageLightbox } from "./image-lightbox";

export function AccountDetail({ id }: { id: number | null }) {
  const [account, setAccount] = useState<ShopAccount | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(id ? "" : "无效的账号ID");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");

    fetchAccount(id)
      .then(setAccount)
      .catch((fetchError) =>
        setError(
          fetchError instanceof Error ? fetchError.message : "获取账号信息失败",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl rounded-md border-destructive/30 bg-destructive/5 shadow-none">
        <CardContent className="p-8 text-center text-sm font-medium text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="mx-auto max-w-3xl rounded-md shadow-none">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          账号不存在
        </CardContent>
      </Card>
    );
  }

  const badges = getAccountBadges(account);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section className="min-w-0 space-y-4">
        <AccountGallery
          account={account}
          onPreview={(index) => {
            setPreviewIndex(index);
            setPreviewOpen(true);
          }}
        />

        <Card className="rounded-md shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">账号说明</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div
              className="min-h-20 rounded-md bg-muted p-4 text-sm leading-7 text-foreground/85 break-words"
              dangerouslySetInnerHTML={{ __html: account.description || "-" }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-md border-amber-200 bg-amber-50/60 shadow-none">
          <CardHeader className="border-b border-amber-200/70">
            <CardTitle className="text-base text-amber-950">交易提醒</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 text-sm leading-7 text-amber-950/85">
            <p>
              购买可点击链接跳入闲鱼 app 联系，认准店铺：567手游店。私下购买认准微信号：wlq16680802181。
            </p>
            <p>购买账号支持分期、预定服务等。</p>
            <p>国家法律规定，未成年人不能参与虚拟物品交易。</p>
            <p>数字化商品根据商品性质不支持七天无理由退货及三包服务。</p>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="rounded-md shadow-none">
          <CardHeader className="space-y-3 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Hash size={14} />
                  {account.serialNumber}
                </div>
                <CardTitle className="mt-2 text-xl leading-tight">
                  {account.title}
                </CardTitle>
              </div>
              <Badge
                className="rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700"
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
                    className="rounded-sm font-normal"
                    variant="secondary"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Ask price
              </div>
              <div className="mt-1 font-mono text-4xl font-bold text-price">
                {formatPrice(account.price)}
              </div>
            </div>

            {account.xianyuUrl ? (
              <Button asChild className="h-11 w-full rounded-md">
                <a href={account.xianyuUrl} rel="noreferrer" target="_blank">
                  查看闲鱼商品
                  <ExternalLink size={16} />
                </a>
              </Button>
            ) : (
              <Button className="h-11 w-full rounded-md" disabled>
                暂无外部购买链接
              </Button>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <Metric icon={<Camera size={16} />} label="截图" value={`${account.images.length} 张`} />
              <Metric icon={<Store size={16} />} label="店铺" value="567手游店" />
              <Metric icon={<Clock3 size={16} />} label="更新" value={formatDate(account.updatedAt)} />
              <Metric icon={<ShieldCheck size={16} />} label="交易" value="闲鱼联系" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md shadow-none">
          <CardContent className="space-y-3 p-4">
            <TrustItem>商品截图与描述优先以详情页和闲鱼沟通确认为准</TrustItem>
            <TrustItem>付款前确认编号、价格和账号截图，避免私下冒充</TrustItem>
            <TrustItem>虚拟商品交易请确认适龄与平台规则后再购买</TrustItem>
          </CardContent>
        </Card>
      </aside>

      <ImageLightbox
        images={account.images}
        open={previewOpen}
        startIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </main>
  );
}

function AccountGallery({
  account,
  onPreview,
}: {
  account: ShopAccount;
  onPreview: (index: number) => void;
}) {
  const mainImage = account.images[0];

  return (
    <Card className="overflow-hidden rounded-md shadow-none">
      <div className="relative aspect-[4/3] bg-muted sm:aspect-[16/10]">
        {mainImage ? (
          <button
            className="relative size-full overflow-hidden"
            type="button"
            onClick={() => onPreview(0)}
          >
            <Image
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 760px, 100vw"
              src={mainImage}
              alt={account.title}
              unoptimized
            />
          </button>
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            暂无图片
          </div>
        )}
      </div>
      {account.images.length > 1 ? (
        <CardContent className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
          {account.images.slice(0, 12).map((image, index) => (
            <button
              key={`${image}-${index}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-sm border border-border bg-muted transition-opacity active:opacity-80",
                index === 0 && "ring-2 ring-foreground ring-offset-2",
              )}
              type="button"
              onClick={() => onPreview(index)}
            >
              <Image
                fill
                className="object-cover"
                sizes="96px"
                src={image}
                alt="账号截图"
                unoptimized
              />
            </button>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <Card className="overflow-hidden rounded-md shadow-none">
        <Skeleton className="aspect-[4/3] rounded-none sm:aspect-[16/10]" />
        <CardContent className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-sm" />
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-md shadow-none">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function TrustItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm leading-6 text-muted-foreground">
      <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
      <span>{children}</span>
    </div>
  );
}
