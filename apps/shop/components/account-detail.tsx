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
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <Card>
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl border-destructive/30 bg-destructive/5">
        <CardContent className="p-8 text-center text-sm font-medium text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          账号不存在
        </CardContent>
      </Card>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl leading-tight">
              {account.title}
            </CardTitle>
            <Badge variant="secondary">CODM</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            编号: {account.serialNumber}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <InfoItem label="价格">
            <span className="font-mono text-2xl font-extrabold text-price">
              <span className="mr-0.5 text-sm">¥</span>
              {account.price}
            </span>
          </InfoItem>
          {account.xianyuUrl ? (
            <InfoItem label="闲鱼链接">
              <Button
                asChild
                className="rounded-full"
                size="sm"
                variant="outline"
              >
                <a href={account.xianyuUrl} rel="noreferrer" target="_blank">
                  查看闲鱼商品
                  <ExternalLink size={15} />
                </a>
              </Button>
            </InfoItem>
          ) : null}
          <InfoItem label="描述" block>
            <div
              className="rounded-md border-l-4 border-primary bg-muted p-3 text-left leading-7 break-words"
              dangerouslySetInnerHTML={{ __html: account.description || "-" }}
            />
          </InfoItem>
          <InfoItem label="更新时间">{formatDate(account.updatedAt)}</InfoItem>
        </CardContent>
      </Card>

      {account.images.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">账号截图</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {account.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted transition-opacity active:opacity-80"
                  type="button"
                  onClick={() => {
                    setPreviewIndex(index);
                    setPreviewOpen(true);
                  }}
                >
                  <Image
                    fill
                    className="object-cover"
                    sizes="(min-width: 720px) 240px, 50vw"
                    src={image}
                    alt="账号截图"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="space-y-2 p-4 text-sm leading-7 text-foreground/85">
          <div className="font-bold text-destructive">重要提示</div>
          <p>
            1. 购买可以点击链接跳入闲鱼 app
            直接联系，认准店铺：567手游店。私下购买认准微信号：wlq16680802181，防止被骗。
          </p>
          <p>2. 购买账号支持分期、预定服务等。</p>
          <p>3. 国家法律规定，未成年人不能参与虚拟物品交易。</p>
          <p>
            4. 平台提供的数字化商品根据商品性质不支持七天无理由退货及三包服务。
          </p>
        </CardContent>
      </Card>

      <ImageLightbox
        images={account.images}
        open={previewOpen}
        startIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </main>
  );
}

function InfoItem({
  block = false,
  children,
  label,
}: {
  block?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className={
        block ? "flex flex-col gap-2" : "flex items-start justify-between gap-4"
      }
    >
      <div className="shrink-0 text-sm font-semibold text-muted-foreground">
        {label}:
      </div>
      <div className="min-w-0 flex-1 text-right break-words">{children}</div>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("zh-CN");
}
