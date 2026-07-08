"use client";

import type {
  AdminAccount,
  AdminAccountStatistics,
  AdminAccountStatisticsStatus,
} from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import {
  CircleDollarSign,
  PackageCheck,
  PackageMinus,
  PackageSearch,
  PackageX,
  RefreshCw,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountStatusBadge } from "@/components/status-badge";
import { fetchAccountStatistics } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";
import { formatDate, formatPrice } from "@/lib/format";

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: typeof PackageSearch;
};

export function StatisticsPage() {
  const [statistics, setStatistics] = useState<AdminAccountStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadStatistics(refresh = false) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      setStatistics(await fetchAccountStatistics());
    } catch (loadError) {
      const message = errorMessage(loadError, "加载统计失败");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadStatistics();
  }, []);

  if (loading && !statistics) {
    return <StatisticsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">数据统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看账号库存、销售金额和重点运营列表。
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={refreshing}
          type="button"
          variant="outline"
          onClick={() => void loadStatistics(true)}
        >
          {refreshing ? <Spinner /> : <RefreshCw size={16} />}
          {refreshing ? "刷新中..." : "刷新"}
        </Button>
      </div>

      {error ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {statistics ? <StatisticsContent statistics={statistics} /> : null}
    </div>
  );
}

function StatisticsContent({
  statistics,
}: {
  statistics: AdminAccountStatistics;
}) {
  const metrics: Metric[] = [
    {
      label: "账号总数",
      value: String(statistics.summary.totalCount),
      detail: `总标价 ${formatPrice(statistics.summary.totalValue)}`,
      icon: PackageSearch,
    },
    {
      label: "已上架",
      value: String(statistics.summary.listedCount),
      detail: formatPrice(statistics.summary.listedValue),
      icon: Store,
    },
    {
      label: "已下架",
      value: String(statistics.summary.unlistedCount),
      detail: formatPrice(statistics.summary.unlistedValue),
      icon: PackageMinus,
    },
    {
      label: "已出售",
      value: String(statistics.summary.soldCount),
      detail: formatPrice(statistics.summary.soldValue),
      icon: PackageCheck,
    },
    {
      label: "可售总金额",
      value: formatPrice(statistics.summary.availableValue),
      detail: "已上架与已下架账号标价合计",
      icon: CircleDollarSign,
    },
    {
      label: "已售总金额",
      value: formatPrice(statistics.summary.soldValue),
      detail: "按账号标价统计",
      icon: PackageX,
    },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DistributionCard
          label="数量"
          rows={statistics.statusBreakdown}
          value={(row) => row.count}
          valueLabel={(row) => `${row.count} 个`}
        />
        <DistributionCard
          label="金额"
          rows={statistics.statusBreakdown}
          value={(row) => row.totalValue}
          valueLabel={(row) => formatPrice(row.totalValue)}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <AccountListCard
          accounts={statistics.recentSold}
          description="已售账号按最近更新时间倒序排列。"
          title="最近售出"
        />
        <AccountListCard
          accounts={statistics.highValueAvailable}
          description="已上架和已下架账号按标价从高到低排列。"
          title="高价未售"
        />
        <AccountListCard
          accounts={statistics.staleListed}
          description="已上架账号按最近更新时间正序排列。"
          title="长期未更新"
        />
      </div>
    </>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="flex items-start gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-foreground">
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{metric.label}</div>
          <div className="mt-1 truncate text-2xl font-bold tracking-normal">
            {metric.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {metric.detail}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  label,
  rows,
  value,
  valueLabel,
}: {
  label: string;
  rows: AdminAccountStatisticsStatus[];
  value: (row: AdminAccountStatisticsStatus) => number;
  valueLabel: (row: AdminAccountStatisticsStatus) => string;
}) {
  const maxValue = Math.max(0, ...rows.map(value));

  return (
    <Card className="rounded-md shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">状态{label}分布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {rows.map((row) => {
          const rowValue = value(row);
          const width =
            maxValue > 0 ? Math.max(4, (rowValue / maxValue) * 100) : 0;

          return (
            <div className="space-y-1.5" key={`${label}-${row.status}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">{valueLabel(row)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AccountListCard({
  accounts,
  description,
  title,
}: {
  accounts: AdminAccount[];
  description: string;
  title: string;
}) {
  return (
    <Card className="rounded-md shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {accounts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
            暂无数据
          </div>
        ) : (
          accounts.map((account) => (
            <div
              className="rounded-md border border-border p-3"
              key={account.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {account.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge className="rounded-sm" variant="secondary">
                      {account.serialNumber}
                    </Badge>
                    <AccountStatusBadge status={account.status} />
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm font-semibold text-price">
                  {formatPrice(account.price)}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>更新 {formatDate(account.updatedAt)}</span>
                {account.status === 3 ? (
                  <span>已出售</span>
                ) : (
                  <Link
                    className="font-medium text-foreground hover:underline"
                    href={`/accounts/${account.id}/edit`}
                    scroll={false}
                  >
                    编辑
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-full sm:w-24" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
