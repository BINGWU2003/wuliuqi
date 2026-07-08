"use client";

import type { ShopAccount } from "@wuliuqi/types";
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
import { Separator } from "@wuliuqi/ui/components/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wuliuqi/ui/components/sheet";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { preventOutsideDismiss } from "@wuliuqi/ui/lib/modal-interactions";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { fetchAccounts } from "@/lib/client-api";

const PAGE_SIZE = 12;

const priceRanges = [
  { label: "全部价格", min: 0, max: 0 },
  { label: "¥0-500", min: 0, max: 500 },
  { label: "¥501-1000", min: 501, max: 1000 },
  { label: "¥1001-2000", min: 1001, max: 2000 },
  { label: "¥2001-5000", min: 2001, max: 5000 },
  { label: "¥5000+", min: 5001, max: 999999 },
];

const sortOptions = [
  { label: "最新上架", value: "latest" },
  { label: "价格从低到高", value: "price_asc" },
  { label: "价格从高到低", value: "price_desc" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];
type LoadingMode =
  | "initial"
  | "replace"
  | "append"
  | "search"
  | "reset"
  | "filter"
  | "retry";
type ReplaceLoadingMode = Exclude<LoadingMode, "append" | "retry">;
type FailedLoad = {
  page: number;
  replace: boolean;
};

type AccountListProps = {
  compactHeader?: boolean;
  eyebrow?: string;
  heading?: string;
};

export function AccountList({
  compactHeader = false,
  eyebrow = "CODM Marketplace",
  heading = "精选账号",
}: AccountListProps) {
  const [activeRange, setActiveRange] = useState(0);
  const [sort, setSort] = useState<SortValue>("latest");
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
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
      const range = priceRanges[activeRange];
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
        sort,
        status: "1",
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (range && (range.min > 0 || range.max > 0)) {
        params.set("min_price", String(range.min));
        params.set("max_price", String(range.max));
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
    [activeRange, keyword, sort],
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

  function handleSearch() {
    if (isBlockingControls()) {
      return;
    }

    const nextKeyword = searchValue.trim();

    if (nextKeyword === keyword) {
      void loadPage(1, "search", true);
      return;
    }

    nextReplaceModeRef.current = "search";
    setKeyword(nextKeyword);
  }

  function handleRangeChange(nextRange: number) {
    if (isBlockingControls()) {
      return;
    }

    if (nextRange === activeRange) {
      void loadPage(1, "filter", true);
      return;
    }

    nextReplaceModeRef.current = "filter";
    setActiveRange(nextRange);
  }

  function handleSortChange(nextSort: SortValue) {
    if (isBlockingControls()) {
      return;
    }

    if (nextSort === sort) {
      void loadPage(1, "filter", true);
      return;
    }

    nextReplaceModeRef.current = "filter";
    setSort(nextSort);
  }

  function clearFilters() {
    if (isBlockingControls()) {
      return;
    }

    setSearchValue("");

    if (activeRange === 0 && sort === "latest" && keyword === "") {
      void loadPage(1, "reset", true);
      return;
    }

    nextReplaceModeRef.current = "reset";
    setActiveRange(0);
    setSort("latest");
    setKeyword("");
  }

  function retryLastLoad() {
    if (loadingRef.current) {
      return;
    }

    const failedLoad = failedLoadRef.current ?? { page: 1, replace: true };

    void loadPage(failedLoad.page, "retry", failedLoad.replace);
  }

  const activeRangeLabel = priceRanges[activeRange]?.label ?? "全部价格";
  const activeSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? "最新上架";
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Sparkles size={14} />
              {eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">
              {heading}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="rounded-sm px-2 py-1" variant="secondary">
              {total} 个账号
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  aria-label="打开账号筛选"
                  className="h-9 rounded-md md:hidden"
                  disabled={controlsDisabled}
                  title="打开账号筛选"
                  type="button"
                  variant="outline"
                >
                  <SlidersHorizontal size={16} />
                  筛选
                </Button>
              </SheetTrigger>
              <SheetContent
                className="w-[86vw] p-4"
                side="right"
                onFocusOutside={preventOutsideDismiss}
                onInteractOutside={preventOutsideDismiss}
                onPointerDownOutside={preventOutsideDismiss}
              >
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>筛选账号</SheetTitle>
                </SheetHeader>
                <FilterControls
                  activeRange={activeRange}
                  activeSortLabel={activeSortLabel}
                  clearFilters={clearFilters}
                  controlsDisabled={controlsDisabled}
                  loadingMode={loadingMode}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  sort={sort}
                  stacked
                  showInlineLoading={showInlineLoading}
                  onRangeChange={handleRangeChange}
                  onSearch={handleSearch}
                  onSortChange={handleSortChange}
                />
                <SheetClose asChild>
                  <Button
                    className="mt-4 w-full"
                    disabled={isReplaceLoading}
                    title="查看筛选结果"
                    type="button"
                  >
                    {isReplaceLoading && showInlineLoading ? <Spinner /> : null}
                    {isReplaceLoading && showInlineLoading
                      ? "加载中..."
                      : "查看结果"}
                  </Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden rounded-md border border-border bg-card p-3 shadow-xs md:block">
          <FilterControls
            activeRange={activeRange}
            activeSortLabel={activeSortLabel}
            clearFilters={clearFilters}
            controlsDisabled={controlsDisabled}
            loadingMode={loadingMode}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            sort={sort}
            showInlineLoading={showInlineLoading}
            onRangeChange={handleRangeChange}
            onSearch={handleSearch}
            onSortChange={handleSortChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
          <span>{activeRangeLabel}</span>
          <Separator className="h-3" orientation="vertical" />
          <span>{activeSortLabel}</span>
          {keyword ? (
            <>
              <Separator className="h-3" orientation="vertical" />
              <span className="min-w-0 truncate">搜索：{keyword}</span>
            </>
          ) : null}
        </div>
      </div>

      {!error && accounts.length === 0 && !loading ? (
        <Card className="rounded-md shadow-none">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            暂无符合条件的账号
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {accounts.map((account) => (
          <ProductCard key={account.id} account={account} />
        ))}
        {isSkeletonLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden rounded-md shadow-none"
              >
                <Skeleton className="aspect-[4/3] rounded-none" />
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
  activeRange,
  activeSortLabel,
  clearFilters,
  controlsDisabled,
  loadingMode,
  onRangeChange,
  onSearch,
  onSortChange,
  searchValue,
  setSearchValue,
  showInlineLoading,
  sort,
  stacked = false,
}: {
  activeRange: number;
  activeSortLabel: string;
  clearFilters: () => void;
  controlsDisabled: boolean;
  loadingMode: LoadingMode | null;
  onRangeChange: (value: number) => void;
  onSearch: () => void;
  onSortChange: (value: SortValue) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  showInlineLoading: boolean;
  sort: SortValue;
  stacked?: boolean;
}) {
  const isFilterLoading = loadingMode === "filter";
  const isResetLoading = loadingMode === "reset";
  const isSearchLoading = loadingMode === "search";
  const showFilterLoading = showInlineLoading && isFilterLoading;
  const showResetLoading = showInlineLoading && isResetLoading;
  const showSearchLoading = showInlineLoading && isSearchLoading;

  return (
    <div
      className={cn(
        "gap-3",
        stacked ? "flex flex-col" : "grid grid-cols-[1fr_auto]",
      )}
    >
      <form
        className={cn(
          "grid gap-2",
          stacked ? "grid-cols-1" : "grid-cols-[minmax(180px,1fr)_auto]",
        )}
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
        <Button
          className="h-9 rounded-md"
          disabled={controlsDisabled}
          title="搜索账号"
          type="submit"
        >
          {showSearchLoading ? <Spinner /> : null}
          {showSearchLoading ? "搜索中..." : "搜索"}
        </Button>
      </form>

      <div
        className={cn(
          "flex gap-2",
          stacked
            ? "flex-col"
            : "min-w-0 flex-wrap items-center justify-end xl:flex-nowrap",
        )}
      >
        <div className={cn("flex gap-2", stacked ? "flex-wrap" : "flex-wrap")}>
          {priceRanges.map((range, index) => (
            <Button
              key={range.label}
              className="h-9 rounded-md px-3 text-xs"
              disabled={controlsDisabled}
              title={`筛选${range.label}账号`}
              type="button"
              variant={activeRange === index ? "default" : "outline"}
              onClick={() => onRangeChange(index)}
            >
              {showFilterLoading && activeRange === index ? <Spinner /> : null}
              {range.label}
            </Button>
          ))}
        </div>
        <Select
          disabled={controlsDisabled}
          value={sort}
          onValueChange={(value) => onSortChange(value as SortValue)}
        >
          <SelectTrigger
            aria-label="排序"
            className={cn("h-9 rounded-md", stacked ? "w-full" : "w-[154px]")}
            title="选择账号排序"
          >
            <SelectValue placeholder={activeSortLabel} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className={cn(
            "h-9 rounded-md border-border bg-background px-3 text-xs",
            stacked ? "w-full justify-center" : "shrink-0",
          )}
          disabled={controlsDisabled}
          title="重置账号筛选"
          type="button"
          variant="outline"
          onClick={clearFilters}
        >
          {showResetLoading ? <Spinner /> : <RotateCcw size={15} />}
          {showResetLoading ? "重置中..." : "重置"}
        </Button>
      </div>
    </div>
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
