"use client";

import type { ShopAccount } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@wuliuqi/ui/components/tabs";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchAccounts } from "../lib/client-api";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 10;

const priceRanges = [
  { label: "全部", min: 0, max: 0 },
  { label: "0~500元", min: 0, max: 500 },
  { label: "501~1000元", min: 501, max: 1000 },
  { label: "1001~2000元", min: 1001, max: 2000 },
  { label: "2001~5000元", min: 2001, max: 5000 },
  { label: "5000元以上", min: 5001, max: 999999 },
];

export function AccountList() {
  const [activeRange, setActiveRange] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      const range = priceRanges[activeRange];
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
        status: "1",
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (range && (range.min > 0 || range.max > 0)) {
        params.set("min_price", String(range.min));
        params.set("max_price", String(range.max));
      }

      setLoading(true);
      setError("");

      try {
        const result = await fetchAccounts(params);
        setAccounts((current) =>
          replace ? result.list : [...current, ...result.list],
        );
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [activeRange, keyword],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  function handleSearch() {
    setKeyword(searchValue.trim());
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 p-3">
          <Tabs
            value={String(activeRange)}
            onValueChange={(value) => setActiveRange(Number(value))}
          >
            <div className="overflow-x-auto">
              <TabsList className="h-10 w-max justify-start bg-secondary p-1">
                {priceRanges.map((range, index) => (
                  <TabsTrigger
                    key={range.label}
                    className="h-8 min-w-20 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    value={String(index)}
                  >
                    {range.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          <form
            className="grid grid-cols-[1fr_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <Input
              className="h-10 rounded-full bg-background px-4"
              placeholder="搜索账号"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Button className="h-10 rounded-full px-4" type="submit">
              <Search size={16} />
              搜索
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-center text-sm font-medium text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}
      {!error && accounts.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            暂无账号
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {accounts.map((account) => (
          <ProductCard key={account.id} account={account} />
        ))}
        {loading && accounts.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="aspect-square rounded-none" />
                <CardContent className="space-y-3 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))
          : null}
      </div>
      <div className="flex justify-center py-4">
        {page < totalPages ? (
          <Button
            className="rounded-full px-6"
            disabled={loading}
            type="button"
            onClick={() => void loadPage(page + 1, false)}
          >
            {loading ? "加载中..." : "加载更多"}
          </Button>
        ) : accounts.length > 0 ? (
          <span className="py-2 text-sm text-muted-foreground">没有更多了</span>
        ) : loading ? (
          <span className="py-2 text-sm text-muted-foreground">加载中...</span>
        ) : null}
      </div>
    </section>
  );
}
