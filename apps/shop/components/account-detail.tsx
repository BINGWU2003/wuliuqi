"use client";

import { DEFAULT_GAME_KEY } from "@wuliuqi/types";
import type { GameKey, ShopAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { ImageLightbox } from "@wuliuqi/ui/components/image-lightbox";
import { Separator } from "@wuliuqi/ui/components/separator";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { cn } from "@wuliuqi/ui/lib/utils";
import { downloadImageWithWatermark } from "@wuliuqi/utils/browser/image-download";
import {
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hash,
  RefreshCw,
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
} from "@/lib/account-display";
import { fetchAccount } from "@/lib/client-api";
import { SHOP_WECHAT_ID } from "@/lib/contact";
import { ContactOptionsButton } from "@/components/contact-options-button";

type AccountDetailPresentation = "page" | "modal";

export function AccountDetail({
  gameKey = DEFAULT_GAME_KEY,
  id,
  presentation = "page",
}: {
  gameKey?: GameKey;
  id: number | null;
  presentation?: AccountDetailPresentation;
}) {
  const [account, setAccount] = useState<ShopAccount | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(id ? "" : "无效的账号ID");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setAccount(null);
      setLoading(false);
      setError("无效的账号ID");
      return;
    }

    const controller = new AbortController();
    let active = true;

    setAccount(null);
    setLoading(true);
    setError("");

    fetchAccount(id, gameKey, { signal: controller.signal })
      .then((nextAccount) => {
        if (!active) {
          return;
        }

        setAccount(nextAccount);
        setSelectedImageIndex(0);
      })
      .catch((fetchError) => {
        if (!active || controller.signal.aborted || isAbortError(fetchError)) {
          return;
        }

        const message =
          fetchError instanceof Error ? fetchError.message : "获取账号信息失败";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [gameKey, id, retryToken]);

  if (loading) {
    return <DetailSkeleton presentation={presentation} />;
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl rounded-xl border-destructive/30 bg-destructive/5 shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div>
            <div className="text-sm font-medium text-destructive">{error}</div>
            {id ? (
              <div className="mt-1 text-sm text-muted-foreground">
                可以重新加载账号详情。
              </div>
            ) : null}
          </div>
          {id ? (
            <Button
              className="h-9 rounded-md"
              title="重新加载账号详情"
              type="button"
              variant="outline"
              onClick={() => setRetryToken((current) => current + 1)}
            >
              {loading ? <Spinner /> : <RefreshCw size={16} />}
              重新加载
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="mx-auto max-w-3xl rounded-xl shadow-sm">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          账号不存在
        </CardContent>
      </Card>
    );
  }

  const badges = getAccountBadges(account);
  const isModal = presentation === "modal";
  const Root = isModal ? "div" : "main";
  const safeSelectedImageIndex = account.images[selectedImageIndex]
    ? selectedImageIndex
    : 0;

  return (
    <Root
      className={cn(
        "mx-auto grid w-full gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]",
        isModal ? "max-w-none" : "max-w-6xl",
      )}
    >
      <MobileAccountSummary account={account} badges={badges} />

      <section className="min-w-0 space-y-4 pb-4 lg:pb-0">
        <AccountGallery
          account={account}
          selectedIndex={safeSelectedImageIndex}
          onPreview={() => setPreviewOpen(true)}
          onSelect={setSelectedImageIndex}
        />

        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">账号说明</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div
              className="min-h-20 rounded-lg bg-muted p-4 text-sm leading-7 text-foreground/85 break-words"
              dangerouslySetInnerHTML={{ __html: account.description || "-" }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <CardHeader className="border-b border-amber-200/70 dark:border-amber-900/60">
            <CardTitle className="text-base text-amber-950 dark:text-amber-200">
              交易提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 text-sm leading-7 text-amber-950/85 dark:text-amber-100/80">
            <p>
              购买可点击链接跳入闲鱼 app
              联系，认准店铺：567手游店。私下购买认准微信号：{SHOP_WECHAT_ID}。
            </p>
            <p>购买账号支持分期、预定服务等。</p>
            <p>国家法律规定，未成年人不能参与虚拟物品交易。</p>
            <p>数字化商品根据商品性质不支持七天无理由退货及三包服务。</p>
          </CardContent>
        </Card>
      </section>

      <aside
        className={cn(
          "hidden space-y-4 lg:sticky lg:block lg:self-start",
          isModal ? "lg:top-4" : "lg:top-24",
        )}
      >
        <Card className="rounded-xl border-border/80 shadow-sm">
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
                售价
              </div>
              <div className="mt-1 font-mono text-4xl font-bold text-price">
                {formatPrice(account.price)}
              </div>
            </div>

            {account.attributeValues.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  账号属性
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {account.attributeValues.map((attribute) => (
                    <div
                      className="rounded-lg border border-border bg-background p-3"
                      key={attribute.key}
                    >
                      <div className="truncate text-xs font-medium text-muted-foreground">
                        {attribute.label}
                        {!attribute.enabled ? "（已停用）" : ""}
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold">
                        {attribute.displayValue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <ContactOptionsButton className="h-11" />
              {account.xianyuUrl ? (
                <Button asChild className="h-11 w-full rounded-md">
                  <a
                    href={account.xianyuUrl}
                    rel="noreferrer"
                    target="_blank"
                    title={`打开闲鱼商品：${account.serialNumber}`}
                  >
                    闲鱼购买
                    <ExternalLink size={16} />
                  </a>
                </Button>
              ) : (
                <Button className="h-11 w-full rounded-md" disabled>
                  暂无购买链接
                </Button>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <Metric
                icon={<Camera size={16} />}
                label="截图"
                value={`${account.images.length} 张`}
              />
              <Metric
                icon={<Store size={16} />}
                label="店铺"
                value="567手游店"
              />
              <Metric
                icon={<Clock3 size={16} />}
                label="更新"
                value={formatDate(account.updatedAt)}
              />
              <Metric
                icon={<ShieldCheck size={16} />}
                label="交易"
                value="闲鱼联系"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <TrustItem>商品截图与描述优先以详情页和闲鱼沟通确认为准</TrustItem>
            <TrustItem>付款前确认编号、价格和账号截图，避免私下冒充</TrustItem>
            <TrustItem>虚拟商品交易请确认适龄与平台规则后再购买</TrustItem>
          </CardContent>
        </Card>
      </aside>

      <MobilePurchaseBar account={account} />

      <ImageLightbox
        downloadImage={(image) =>
          downloadImageWithWatermark(image, { text: "© 567手游店" })
        }
        images={account.images}
        labels={{ imageAlt: "账号截图预览" }}
        open={previewOpen}
        startIndex={safeSelectedImageIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </Root>
  );
}

function MobileAccountSummary({
  account,
  badges,
}: {
  account: ShopAccount;
  badges: string[];
}) {
  return (
    <Card className="rounded-xl border-border/80 shadow-sm lg:hidden">
      <CardHeader className="space-y-3 border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Hash size={14} />
              {account.serialNumber}
            </div>
            <CardTitle className="mt-1.5 text-xl leading-tight">
              {account.title}
            </CardTitle>
          </div>
          <Badge
            className="shrink-0 rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300"
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
          <div className="text-xs font-semibold text-muted-foreground">
            售价
          </div>
          <div className="mt-1 font-mono text-3xl font-bold text-price">
            {formatPrice(account.price)}
          </div>
        </div>

        {account.attributeValues.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {account.attributeValues.slice(0, 4).map((attribute) => (
              <div
                className="rounded-lg border border-border bg-background p-2.5"
                key={attribute.key}
              >
                <div className="truncate text-xs text-muted-foreground">
                  {attribute.label}
                </div>
                <div className="mt-1 truncate text-sm font-semibold">
                  {attribute.displayValue}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MobilePurchaseBar({ account }: { account: ShopAccount }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-[auto_minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-2 pb-[env(safe-area-inset-bottom)]">
        <div className="min-w-20 pr-1">
          <div className="text-[11px] text-muted-foreground">售价</div>
          <div className="truncate font-mono text-lg font-bold text-price">
            {formatPrice(account.price)}
          </div>
        </div>
        <ContactOptionsButton className="h-11" />
        <XianyuPurchaseButton account={account} label="闲鱼购买" />
      </div>
    </div>
  );
}

function XianyuPurchaseButton({
  account,
  label,
}: {
  account: ShopAccount;
  label: string;
}) {
  return account.xianyuUrl ? (
    <Button asChild className="h-11 w-full rounded-md">
      <a
        href={account.xianyuUrl}
        rel="noreferrer"
        target="_blank"
        title={`打开闲鱼商品：${account.serialNumber}`}
      >
        {label}
        <ExternalLink size={16} />
      </a>
    </Button>
  ) : (
    <Button className="h-11 w-full rounded-md" disabled>
      暂无购买链接
    </Button>
  );
}

function AccountGallery({
  account,
  onPreview,
  onSelect,
  selectedIndex,
}: {
  account: ShopAccount;
  onPreview: () => void;
  onSelect: (index: number) => void;
  selectedIndex: number;
}) {
  const mainImage = account.images[selectedIndex] ?? account.images[0];

  return (
    <Card className="overflow-hidden rounded-xl border-border/80 shadow-sm">
      <div className="relative aspect-[4/3] bg-muted sm:aspect-[16/10]">
        {mainImage ? (
          <button
            aria-label="打开当前账号截图预览"
            className="relative size-full overflow-hidden"
            title="打开当前账号截图预览"
            type="button"
            onClick={onPreview}
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
              aria-label={`选择第 ${index + 1} 张账号截图`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border border-border bg-muted transition-opacity active:opacity-80",
                index === selectedIndex &&
                  "ring-2 ring-foreground ring-offset-2",
              )}
              title={`选择第 ${index + 1} 张账号截图`}
              type="button"
              onClick={() => onSelect(index)}
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

function DetailSkeleton({
  presentation = "page",
}: {
  presentation?: AccountDetailPresentation;
}) {
  const isModal = presentation === "modal";
  const Root = isModal ? "div" : "main";

  return (
    <Root
      className={cn(
        "mx-auto grid w-full gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]",
        isModal ? "max-w-none" : "max-w-6xl",
      )}
    >
      <Card className="overflow-hidden rounded-xl border-border/80 shadow-sm">
        <Skeleton className="aspect-[4/3] rounded-none sm:aspect-[16/10]" />
        <CardContent className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-sm" />
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </Root>
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
    <div className="min-w-0 rounded-lg border border-border bg-background p-3">
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
      <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>{children}</span>
    </div>
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
