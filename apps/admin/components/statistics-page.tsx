"use client";

import type {
  AdminAccount,
  AdminAccountStatistics,
  AdminAccountStatisticsStatus,
  GameKey,
} from "@wuliuqi/types";
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_LABELS,
  DEFAULT_GAME_KEY,
  GAME_KEY,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
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
import { useCallback, useEffect, useState } from "react";
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
const gameOptions: Array<{ label: string; value: GameKey }> = [
  { label: "CODM", value: GAME_KEY.codm },
  { label: "三国杀", value: GAME_KEY.sanguosha },
];

export function StatisticsPage() {
  const [gameKey, setGameKey] = useState<GameKey>(DEFAULT_GAME_KEY);
  const [statistics, setStatistics] = useState<AdminAccountStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStatistics = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      setStatistics(await fetchAccountStatistics(gameKey));
    } catch (loadError) {
      const message = errorMessage(loadError, "加载统计失败");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameKey]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  if (loading && !statistics) {
    return <StatisticsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">业务统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看账号库存、销售金额和重点运营列表。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            value={gameKey}
            onValueChange={(value) => setGameKey(value as GameKey)}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gameOptions.map((game) => (
                <SelectItem key={game.value} value={game.value}>
                  {game.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      detail: `总成本 ${formatPrice(statistics.summary.totalCost)}`,
      icon: PackageSearch,
    },
    {
      label: ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.listed],
      value: String(statistics.summary.listedCount),
      detail: `标价 ${formatPrice(statistics.summary.listedValue)}`,
      icon: Store,
    },
    {
      label: ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.unlisted],
      value: String(statistics.summary.unlistedCount),
      detail: `标价 ${formatPrice(statistics.summary.unlistedValue)}`,
      icon: PackageMinus,
    },
    {
      label: ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.sold],
      value: String(statistics.summary.soldCount),
      detail: `成交额 ${formatPrice(statistics.summary.soldRevenue)}`,
      icon: PackageCheck,
    },
    {
      label: "可售标价",
      value: formatPrice(statistics.summary.availableValue),
      detail: `库存成本 ${formatPrice(statistics.summary.availableCost)}`,
      icon: CircleDollarSign,
    },
    {
      label: "可售预估利润",
      value: formatPrice(statistics.summary.availableEstimatedProfit),
      detail: "已上架与已下架账号标价减成本",
      icon: PackageSearch,
    },
    {
      label: "已售成交额",
      value: formatPrice(statistics.summary.soldRevenue),
      detail: `已售成本 ${formatPrice(statistics.summary.soldCost)}`,
      icon: PackageCheck,
    },
    {
      label: "已售毛利润",
      value: formatPrice(statistics.summary.soldProfit),
      detail: "成交价减成本",
      icon: PackageX,
    },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
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
        <DistributionCard
          label="成本"
          rows={statistics.statusBreakdown}
          value={(row) => row.totalCost}
          valueLabel={(row) => formatPrice(row.totalCost)}
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
                <div className="shrink-0 text-right font-mono text-sm font-semibold text-price">
                  {formatPrice(
                    account.status === ACCOUNT_STATUS.sold
                      ? (account.soldPrice ?? 0)
                      : account.price,
                  )}
                  <div className="mt-1 text-[11px] font-normal text-muted-foreground">
                    {account.status === ACCOUNT_STATUS.sold
                      ? `利润 ${formatPrice(account.profit ?? 0)}`
                      : `成本 ${formatPrice(account.costPrice)}`}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>更新 {formatDate(account.updatedAt)}</span>
                {account.status === ACCOUNT_STATUS.sold ? (
                  <Link
                    className="font-medium text-foreground hover:underline"
                    href={`/accounts/${account.id}/edit?game_key=${account.gameKey}&mode=view`}
                    scroll={false}
                  >
                    查看
                  </Link>
                ) : (
                  <Link
                    className="font-medium text-foreground hover:underline"
                    href={`/accounts/${account.id}/edit?game_key=${account.gameKey}`}
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-52" />
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
