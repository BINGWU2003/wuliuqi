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
import { cn } from "@wuliuqi/ui/lib/utils";
import { SlidersHorizontal, Sparkles, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAccounts } from "../lib/client-api";
import { ProductCard } from "./product-card";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const totalPagesRef = useRef(0);
  const errorRef = useRef("");

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean) => {
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

      loadingRef.current = true;
      errorRef.current = "";
      setLoading(true);
      setError("");

      try {
        const result = await fetchAccounts(params);
        setAccounts((current) =>
          replace ? result.list : [...current, ...result.list],
        );
        setPage(result.pagination.page);
        pageRef.current = result.pagination.page;
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        totalPagesRef.current = result.pagination.totalPages;
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "加载失败";
        errorRef.current = message;
        setError(message);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [activeRange, keyword, sort],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  useEffect(() => {
    pageRef.current = page;
    totalPagesRef.current = totalPages;
    loadingRef.current = loading;
    errorRef.current = error;
  }, [error, loading, page, totalPages]);

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
          void loadPage(pageRef.current + 1, false);
        }
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [loadPage]);

  function handleSearch() {
    setKeyword(searchValue.trim());
  }

  function clearFilters() {
    setActiveRange(0);
    setSort("latest");
    setSearchValue("");
    setKeyword("");
  }

  const activeRangeLabel = priceRanges[activeRange]?.label ?? "全部价格";
  const activeSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? "最新上架";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div
        className={cn(
          "flex flex-col gap-3",
          compactHeader ? "pt-1" : "pt-2",
        )}
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
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  className="h-9 rounded-md md:hidden"
                  type="button"
                  variant="outline"
                >
                  <SlidersHorizontal size={16} />
                  筛选
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[86vw] p-4" side="right">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>筛选账号</SheetTitle>
                </SheetHeader>
                <FilterControls
                  activeRange={activeRange}
                  activeSortLabel={activeSortLabel}
                  clearFilters={clearFilters}
                  searchValue={searchValue}
                  setActiveRange={setActiveRange}
                  setSearchValue={setSearchValue}
                  setSort={setSort}
                  sort={sort}
                  stacked
                  onSearch={handleSearch}
                />
                <SheetClose asChild>
                  <Button className="mt-4 w-full" type="button">
                    查看结果
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
            searchValue={searchValue}
            setActiveRange={setActiveRange}
            setSearchValue={setSearchValue}
            setSort={setSort}
            sort={sort}
            onSearch={handleSearch}
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

      {error ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-5 text-center text-sm font-medium text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}

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
        {loading && accounts.length === 0
          ? Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden rounded-md shadow-none">
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

      <div
        ref={loadMoreRef}
        className="flex min-h-12 items-center justify-center py-4"
      >
        {loading && accounts.length > 0 ? (
          <span className="text-sm text-muted-foreground">正在加载更多...</span>
        ) : accounts.length > 0 && page >= totalPages ? (
          <span className="text-sm text-muted-foreground">没有更多了</span>
        ) : accounts.length > 0 ? (
          <span className="text-sm text-muted-foreground">下滑加载更多</span>
        ) : loading ? (
          <span className="text-sm text-muted-foreground">加载中...</span>
        ) : null}
      </div>
    </section>
  );
}

function FilterControls({
  activeRange,
  activeSortLabel,
  clearFilters,
  onSearch,
  searchValue,
  setActiveRange,
  setSearchValue,
  setSort,
  sort,
  stacked = false,
}: {
  activeRange: number;
  activeSortLabel: string;
  clearFilters: () => void;
  onSearch: () => void;
  searchValue: string;
  setActiveRange: (value: number) => void;
  setSearchValue: (value: string) => void;
  setSort: (value: SortValue) => void;
  sort: SortValue;
  stacked?: boolean;
}) {
  return (
    <div className={cn("gap-3", stacked ? "flex flex-col" : "grid grid-cols-[1fr_auto]")}>
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
        <Button className="h-9 rounded-md" type="submit">
          搜索
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
              type="button"
              variant={activeRange === index ? "default" : "outline"}
              onClick={() => setActiveRange(index)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        <Select value={sort} onValueChange={(value) => setSort(value as SortValue)}>
          <SelectTrigger
            aria-label="排序"
            className={cn("h-9 rounded-md", stacked ? "w-full" : "w-[154px]")}
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
          className="h-9 rounded-md"
          type="button"
          variant="ghost"
          onClick={clearFilters}
        >
          重置
        </Button>
      </div>
    </div>
  );
}
