"use client";

import {
  ACCOUNT_SORT,
  DEFAULT_GAME_KEY,
  SHOP_GAME_ATTRIBUTE_FILTERS,
} from "@wuliuqi/types";
import type {
  AccountSort,
  GameKey,
  PublicShopAccount,
  ShopAttributeFilterConfig,
} from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
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
import { cn } from "@wuliuqi/ui/lib/utils";
import { RefreshCw, RotateCcw, Search, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { fetchAccounts } from "@/lib/client-api";
import {
  accountListSearchParams,
  attributeRangeOption,
  priceRangeOption,
  SHOP_PRICE_RANGES,
} from "@/lib/shop-filters";
import type {
  AccountListFilterState,
  ShopAttributeSelections,
  ShopPriceRangeValue,
} from "@/lib/shop-filters";

const PAGE_SIZE = 12;

const sortOptions = [
  { label: "最新上架", value: ACCOUNT_SORT.latest },
  { label: "价格从低到高", value: ACCOUNT_SORT.priceAsc },
  { label: "价格从高到低", value: ACCOUNT_SORT.priceDesc },
] as const;

type SortValue = AccountSort;
type LoadingMode =
  "initial" | "replace" | "append" | "search" | "reset" | "filter" | "retry";
type ReplaceLoadingMode = Exclude<LoadingMode, "append" | "retry">;
type FailedLoad = {
  page: number;
  replace: boolean;
};

type AccountListProps = {
  compactHeader?: boolean;
  eyebrow?: string;
  gameKey?: GameKey;
  heading?: string;
  initialFilters: AccountListFilterState;
};

export function AccountList({
  compactHeader = false,
  eyebrow = "CODM Marketplace",
  gameKey = DEFAULT_GAME_KEY,
  heading = "精选账号",
  initialFilters,
}: AccountListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const attributeFilterConfigs = SHOP_GAME_ATTRIBUTE_FILTERS[gameKey];
  const [priceRangeValue, setPriceRangeValue] = useState<ShopPriceRangeValue>(
    initialFilters.priceRange,
  );
  const priceRange = initialFilters.priceRange;
  const [attributeSelectionsValue, setAttributeSelectionsValue] =
    useState<ShopAttributeSelections>(initialFilters.attributeSelections);
  const attributeSelections = initialFilters.attributeSelections;
  const [sortValue, setSortValue] = useState<SortValue>(initialFilters.sort);
  const sort = initialFilters.sort;
  const [searchValue, setSearchValue] = useState(initialFilters.keyword);
  const keyword = initialFilters.keyword;
  const [accounts, setAccounts] = useState<PublicShopAccount[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMode, setLoadingMode] = useState<LoadingMode | null>("initial");
  const [error, setError] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const loadingModeRef = useRef<LoadingMode | null>("initial");
  const pageRef = useRef(1);
  const totalPagesRef = useRef(0);
  const errorRef = useRef("");
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const nextReplaceModeRef = useRef<ReplaceLoadingMode>("initial");
  const failedLoadRef = useRef<FailedLoad | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, mode: LoadingMode, replace: boolean) => {
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      const range = priceRangeOption(priceRange);
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
        sort,
        status: "1",
        game_key: gameKey,
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (range?.min !== undefined) {
        params.set("min_price", String(range.min));
      }

      if (range?.max !== undefined) {
        params.set("max_price", String(range.max));
      }

      for (const config of attributeFilterConfigs) {
        const option = attributeRangeOption(
          gameKey,
          config.urlKey,
          attributeSelections[config.urlKey] ?? "all",
        );

        if (option?.min !== undefined) {
          params.set(config.minQueryKey, String(option.min));
        }

        if (option?.max !== undefined) {
          params.set(config.maxQueryKey, String(option.max));
        }
      }

      requestControllerRef.current?.abort();
      requestControllerRef.current = controller;
      loadingRef.current = true;
      loadingModeRef.current = mode;
      errorRef.current = "";
      setLoading(true);
      setLoadingMode(mode);

      if (mode !== "retry") {
        setError("");
      }

      try {
        const result = await fetchAccounts(params, {
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        failedLoadRef.current = null;
        setError("");
        setAccounts((current) =>
          replace ? result.list : [...current, ...result.list],
        );
        setPage(result.pagination.page);
        pageRef.current = result.pagination.page;
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        totalPagesRef.current = result.pagination.totalPages;
      } catch (fetchError) {
        if (
          controller.signal.aborted ||
          requestId !== requestIdRef.current ||
          isAbortError(fetchError)
        ) {
          return;
        }

        const message =
          fetchError instanceof Error ? fetchError.message : "加载失败";
        failedLoadRef.current = { page: nextPage, replace };
        errorRef.current = message;
        setError(message);
        toast.error(message);
      } finally {
        if (requestId === requestIdRef.current) {
          requestControllerRef.current = null;
          loadingRef.current = false;
          loadingModeRef.current = null;
          setLoading(false);
          setLoadingMode(null);
        }
      }
    },
    [
      attributeFilterConfigs,
      attributeSelections,
      gameKey,
      keyword,
      priceRange,
      sort,
    ],
  );

  useEffect(() => {
    const mode = nextReplaceModeRef.current;

    nextReplaceModeRef.current = "replace";
    void loadPage(1, mode, true);
  }, [loadPage]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      requestControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    pageRef.current = page;
    totalPagesRef.current = totalPages;
    loadingRef.current = loading;
    loadingModeRef.current = loadingMode;
    errorRef.current = error;
  }, [error, loading, loadingMode, page, totalPages]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || loadingRef.current || errorRef.current) {
          return;
        }

        if (pageRef.current < totalPagesRef.current) {
          void loadPage(pageRef.current + 1, "append", false);
        }
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [loadPage]);

  function isBlockingControls() {
    return loadingRef.current && loadingModeRef.current !== "append";
  }

  function handlePriceRangeChange(nextRange: ShopPriceRangeValue) {
    if (isBlockingControls()) {
      return;
    }

    setPriceRangeValue(nextRange);
  }

  function handleAttributeRangeChange(urlKey: string, value: string) {
    if (isBlockingControls()) {
      return;
    }

    setAttributeSelectionsValue((current) => ({
      ...current,
      [urlKey]: value,
    }));
  }

  function handleSortChange(nextSort: SortValue) {
    if (isBlockingControls()) {
      return;
    }

    setSortValue(nextSort);
  }

  function applyFilters() {
    if (isBlockingControls()) {
      return;
    }

    const nextKeyword = searchValue.trim();

    if (
      nextKeyword === keyword &&
      priceRangeValue === priceRange &&
      sameAttributeSelections(
        attributeSelectionsValue,
        attributeSelections,
        attributeFilterConfigs,
      ) &&
      sortValue === sort
    ) {
      void loadPage(1, "search", true);
      return;
    }

    replaceFilterUrl({
      attributeSelections: attributeSelectionsValue,
      keyword: nextKeyword,
      priceRange: priceRangeValue,
      sort: sortValue,
    });
  }

  function clearFilters() {
    if (isBlockingControls()) {
      return;
    }

    setSearchValue("");
    setPriceRangeValue("all");
    const emptyAttributeSelections = Object.fromEntries(
      attributeFilterConfigs.map((config) => [config.urlKey, "all"]),
    );
    setAttributeSelectionsValue(emptyAttributeSelections);
    setSortValue(ACCOUNT_SORT.latest);

    if (
      priceRange === "all" &&
      sameAttributeSelections(
        attributeSelections,
        emptyAttributeSelections,
        attributeFilterConfigs,
      ) &&
      sort === ACCOUNT_SORT.latest &&
      keyword === ""
    ) {
      void loadPage(1, "reset", true);
      return;
    }

    nextReplaceModeRef.current = "reset";
    replaceFilterUrl({
      attributeSelections: emptyAttributeSelections,
      keyword: "",
      priceRange: "all",
      sort: ACCOUNT_SORT.latest,
    });
  }

  function replaceFilterUrl(nextFilters: AccountListFilterState) {
    const query = accountListSearchParams(nextFilters, gameKey).toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function retryLastLoad() {
    if (loadingRef.current) {
      return;
    }

    const failedLoad = failedLoadRef.current ?? { page: 1, replace: true };

    void loadPage(failedLoad.page, "retry", failedLoad.replace);
  }

  const isReplaceLoading = loading && loadingMode !== "append";
  const isRetryLoading = loading && loadingMode === "retry";
  const isSkeletonLoading = loading && accounts.length === 0 && !error;
  const showInlineLoading = !isSkeletonLoading;
  const controlsDisabled = isReplaceLoading;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div
        className={cn("flex flex-col gap-3", compactHeader ? "pt-1" : "pt-2")}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Sparkles size={14} />
              {eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">
              {heading}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-sm px-2 py-1" variant="secondary">
              {total} 个账号
            </Badge>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-3 shadow-xs">
          <FilterControls
            clearFilters={clearFilters}
            attributeFilterConfigs={attributeFilterConfigs}
            attributeSelections={attributeSelectionsValue}
            controlsDisabled={controlsDisabled}
            loadingMode={loadingMode}
            priceRangeValue={priceRangeValue}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            sortValue={sortValue}
            showInlineLoading={showInlineLoading}
            onAttributeRangeChange={handleAttributeRangeChange}
            onPriceRangeChange={handlePriceRangeChange}
            onSearch={applyFilters}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {!error && accounts.length === 0 && !loading ? (
        <Card className="rounded-md shadow-none">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            暂无符合条件的账号
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account, index) => (
          <ProductCard key={account.id} account={account} eager={index < 2} />
        ))}
        {isSkeletonLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden rounded-md shadow-none"
              >
                <Skeleton className="aspect-video rounded-none md:aspect-[4/3]" />
                <CardContent className="space-y-3 p-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-7 w-24" />
                </CardContent>
              </Card>
            ))
          : null}
      </div>

      {error ? (
        <LoadErrorState
          loading={isRetryLoading}
          message={error}
          onRetry={retryLastLoad}
        />
      ) : null}

      <div
        ref={loadMoreRef}
        className="flex min-h-12 items-center justify-center py-4"
      >
        {loading && accounts.length > 0 && !error ? (
          <LoadingLine
            label={loadingMode === "append" ? "正在加载更多" : "正在刷新结果"}
          />
        ) : accounts.length > 0 && !error && page >= totalPages ? (
          <span className="text-sm text-muted-foreground">没有更多了</span>
        ) : accounts.length > 0 && !error ? (
          <span className="text-sm text-muted-foreground">下滑加载更多</span>
        ) : null}
      </div>
    </section>
  );
}

function FilterControls({
  attributeFilterConfigs,
  attributeSelections,
  clearFilters,
  controlsDisabled,
  loadingMode,
  onAttributeRangeChange,
  onPriceRangeChange,
  onSearch,
  onSortChange,
  priceRangeValue,
  searchValue,
  setSearchValue,
  showInlineLoading,
  sortValue,
}: {
  attributeFilterConfigs: readonly ShopAttributeFilterConfig[];
  attributeSelections: ShopAttributeSelections;
  clearFilters: () => void;
  controlsDisabled: boolean;
  loadingMode: LoadingMode | null;
  onAttributeRangeChange: (urlKey: string, value: string) => void;
  onPriceRangeChange: (value: ShopPriceRangeValue) => void;
  onSearch: () => void;
  onSortChange: (value: SortValue) => void;
  priceRangeValue: ShopPriceRangeValue;
  searchValue: string;
  setSearchValue: (value: string) => void;
  showInlineLoading: boolean;
  sortValue: SortValue;
}) {
  const isFilterLoading = loadingMode === "filter";
  const isResetLoading = loadingMode === "reset";
  const isSearchLoading = loadingMode === "search";
  const showFilterLoading = showInlineLoading && isFilterLoading;
  const showResetLoading = showInlineLoading && isResetLoading;
  const showSearchLoading = showInlineLoading && isSearchLoading;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <form
        className="col-span-2 min-w-0"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            className="h-9 rounded-md bg-background pl-9"
            placeholder="搜索编号、标题"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>
      </form>

      <Select
        disabled={controlsDisabled}
        value={priceRangeValue}
        onValueChange={(value) =>
          onPriceRangeChange(value as ShopPriceRangeValue)
        }
      >
        <SelectTrigger
          aria-label="价格区间"
          className="h-9 rounded-md"
          title="选择价格区间"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SHOP_PRICE_RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={controlsDisabled}
        value={sortValue}
        onValueChange={(value) => onSortChange(value as SortValue)}
      >
        <SelectTrigger
          aria-label="排序"
          className="h-9 rounded-md"
          title="选择账号排序"
        >
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
      {attributeFilterConfigs.map((config) => (
        <Select
          key={config.attributeKey}
          disabled={controlsDisabled}
          value={attributeSelections[config.urlKey] ?? "all"}
          onValueChange={(value) =>
            onAttributeRangeChange(config.urlKey, value)
          }
        >
          <SelectTrigger
            aria-label={`${config.label}数量`}
            className="h-9 rounded-md"
            title={`筛选${config.label}数量`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {config.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <div className="col-span-2 grid grid-cols-2 gap-2">
        <Button
          className="h-9 rounded-md bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
          disabled={controlsDisabled}
          title="搜索账号"
          type="button"
          onClick={onSearch}
        >
          {showSearchLoading ? <Spinner /> : <Search size={15} />}
          {showSearchLoading ? "搜索中..." : "搜索"}
        </Button>
        <Button
          className="h-9 rounded-md border-border bg-background px-3 text-xs"
          disabled={controlsDisabled}
          title="重置账号筛选"
          type="button"
          variant="outline"
          onClick={clearFilters}
        >
          {showResetLoading || showFilterLoading ? (
            <Spinner />
          ) : (
            <RotateCcw size={15} />
          )}
          {showResetLoading || showFilterLoading ? "加载中..." : "重置"}
        </Button>
      </div>
    </div>
  );
}

function sameAttributeSelections(
  first: ShopAttributeSelections,
  second: ShopAttributeSelections,
  configs: readonly ShopAttributeFilterConfig[],
) {
  return configs.every(
    (config) =>
      (first[config.urlKey] ?? "all") === (second[config.urlKey] ?? "all"),
  );
}

function LoadErrorState({
  loading,
  message,
  onRetry,
}: {
  loading: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="min-w-0">
          <div className="text-sm font-medium text-destructive">
            账号加载失败
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{message}</div>
        </div>
        <Button
          className="h-9 rounded-md"
          disabled={loading}
          title="重新加载账号"
          type="button"
          variant="outline"
          onClick={onRetry}
        >
          {loading ? <Spinner /> : <RefreshCw size={16} />}
          {loading ? "重试中..." : "重新加载"}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </span>
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
