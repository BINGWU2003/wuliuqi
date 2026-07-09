"use client";

import type { GameKey, PublicShopAccount } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { fetchHomeAccounts } from "@/lib/client-api";

const HOME_PAGE_SIZE = 12;

const gameOptions: Array<{ label: string; value: HomeGameFilter }> = [
  { label: "全部游戏", value: "all" },
  { label: "CODM", value: "codm" },
  { label: "三国杀", value: "sanguosha" },
];

const priceRanges = [
  { label: "全部价格", min: 0, max: 0, value: "all" },
  { label: "¥0-500", min: 0, max: 500, value: "0-500" },
  { label: "¥501-1000", min: 501, max: 1000, value: "501-1000" },
  { label: "¥1001-2000", min: 1001, max: 2000, value: "1001-2000" },
  { label: "¥2001-5000", min: 2001, max: 5000, value: "2001-5000" },
  { label: "¥5000+", min: 5001, max: 999999, value: "5000+" },
] as const;

const sortOptions = [
  { label: "最新上架", value: "latest" },
  { label: "价格从低到高", value: "price_asc" },
  { label: "价格从高到低", value: "price_desc" },
] as const;

type HomeGameFilter = GameKey | "all";
type HomePriceRangeValue = (typeof priceRanges)[number]["value"];
type HomeSortValue = (typeof sortOptions)[number]["value"];
type LoadingMode = "initial" | "append" | "filter";

export function HomeAccountFeed() {
  const [accounts, setAccounts] = useState<PublicShopAccount[]>([]);
  const [gameKeyValue, setGameKeyValue] = useState<HomeGameFilter>("all");
  const [gameKey, setGameKey] = useState<HomeGameFilter>("all");
  const [priceRangeValue, setPriceRangeValue] =
    useState<HomePriceRangeValue>("all");
  const [priceRange, setPriceRange] = useState<HomePriceRangeValue>("all");
  const [sortValue, setSortValue] = useState<HomeSortValue>("latest");
  const [sort, setSort] = useState<HomeSortValue>("latest");
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMode, setLoadingMode] = useState<LoadingMode | null>("initial");
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadAccounts = useCallback(
    async (mode: LoadingMode, cursor?: string) => {
      const requestId = ++requestIdRef.current;
      const params = new URLSearchParams({
        game_key: gameKey,
        limit: String(HOME_PAGE_SIZE),
        sort,
      });
      const range = priceRanges.find((item) => item.value === priceRange);

      if (cursor) {
        params.set("cursor", cursor);
      }

      if (range && (range.min > 0 || range.max > 0)) {
        params.set("min_price", String(range.min));
        params.set("max_price", String(range.max));
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
    [gameKey, priceRange, sort],
  );

  useEffect(() => {
    const mode = hasLoadedRef.current ? "filter" : "initial";

    hasLoadedRef.current = true;
    void loadAccounts(mode);
  }, [loadAccounts]);

  useEffect(() => {
    if (!nextCursor || loadingMode !== null || error) {
      return;
    }

    const sentinel = loadMoreRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();
        void loadAccounts("append", nextCursor);
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [error, loadAccounts, loadingMode, nextCursor]);

  const loadingInitial = loadingMode === "initial";
  const loadingAppend = loadingMode === "append";
  const loadingFilter = loadingMode === "filter";
  const controlsDisabled = loadingMode !== null && loadingMode !== "append";

  function resetFilters() {
    if (controlsDisabled) {
      return;
    }

    setGameKeyValue("all");
    setPriceRangeValue("all");
    setSortValue("latest");

    if (gameKey === "all" && priceRange === "all" && sort === "latest") {
      void loadAccounts("filter");
      return;
    }

    setGameKey("all");
    setPriceRange("all");
    setSort("latest");
  }

  function searchAccounts() {
    if (controlsDisabled) {
      return;
    }

    if (
      gameKeyValue === gameKey &&
      priceRangeValue === priceRange &&
      sortValue === sort
    ) {
      void loadAccounts("filter");
      return;
    }

    setGameKey(gameKeyValue);
    setPriceRange(priceRangeValue);
    setSort(sortValue);
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            最近 3 个月
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-normal">账号市场</h2>
        </div>
        <div className="shrink-0 rounded-sm border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
          {loadingInitial ? "加载中" : `已展示 ${accounts.length} 个账号`}
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-card p-3 shadow-xs sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Select
          disabled={controlsDisabled}
          value={gameKeyValue}
          onValueChange={(value) => setGameKeyValue(value as HomeGameFilter)}
        >
          <SelectTrigger className="h-9 rounded-md" aria-label="游戏分类">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gameOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          disabled={controlsDisabled}
          value={priceRangeValue}
          onValueChange={(value) =>
            setPriceRangeValue(value as HomePriceRangeValue)
          }
        >
          <SelectTrigger className="h-9 rounded-md" aria-label="价格区间">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          disabled={controlsDisabled}
          value={sortValue}
          onValueChange={(value) => setSortValue(value as HomeSortValue)}
        >
          <SelectTrigger className="h-9 rounded-md" aria-label="排序">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-9 rounded-md bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
            disabled={controlsDisabled}
            title="搜索首页账号"
            type="button"
            onClick={searchAccounts}
          >
            {loadingFilter ? <Spinner /> : <Search size={15} />}
            {loadingFilter ? "搜索中..." : "搜索"}
          </Button>
          <Button
            className="h-9 rounded-md border-border bg-background px-3 text-xs"
            disabled={controlsDisabled}
            title="重置首页筛选"
            type="button"
            variant="outline"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            重置
          </Button>
        </div>
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
        <div ref={loadMoreRef} className="flex min-h-10 justify-center pt-1">
          {loadingAppend ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              正在加载更多
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
