"use client";

import type { ShopAccount } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { fetchHomeAccounts } from "@/lib/client-api";

const HOME_PAGE_SIZE = 12;

type LoadingMode = "initial" | "append" | "refresh";

export function HomeAccountFeed() {
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMode, setLoadingMode] = useState<LoadingMode | null>("initial");
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const loadAccounts = useCallback(
    async (mode: LoadingMode, cursor?: string) => {
      const requestId = ++requestIdRef.current;
      const params = new URLSearchParams({
        limit: String(HOME_PAGE_SIZE),
      });

      if (cursor) {
        params.set("cursor", cursor);
      }

      setLoadingMode(mode);
      setError("");

      try {
        const result = await fetchHomeAccounts(params);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setAccounts((current) =>
          mode === "append" ? [...current, ...result.list] : result.list,
        );
        setNextCursor(result.nextCursor);
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "加载失败";

        setError(message);
        toast.error(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingMode(null);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadAccounts("initial");
  }, [loadAccounts]);

  const loadingInitial = loadingMode === "initial";
  const loadingAppend = loadingMode === "append";
  const loadingRefresh = loadingMode === "refresh";

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            最近 3 个月
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-normal">账号市场</h2>
        </div>
        <Button
          className="rounded-md"
          disabled={loadingMode !== null}
          size="sm"
          type="button"
          variant="outline"
          onClick={() => void loadAccounts("refresh")}
        >
          {loadingRefresh ? <Spinner /> : <RefreshCw size={16} />}
          刷新
        </Button>
      </div>

      {loadingInitial ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="aspect-[4/5] rounded-md" key={index} />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {accounts.map((account) => (
            <ProductCard
              account={account}
              key={`${account.gameKey}-${account.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
          最近 3 个月暂无已上架账号
        </div>
      )}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center pt-1">
          <Button
            className="rounded-md"
            disabled={loadingMode !== null}
            type="button"
            variant="outline"
            onClick={() => void loadAccounts("append", nextCursor)}
          >
            {loadingAppend ? <Spinner /> : null}
            {loadingAppend ? "加载中..." : "加载更多"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
