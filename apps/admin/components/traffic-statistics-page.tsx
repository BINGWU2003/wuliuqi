"use client";

import type {
  AdminTrafficStatistics,
  TrafficBreakdownRow,
  TrafficGameFilter,
  TrafficRange,
  TrafficTopAccount,
} from "@wuliuqi/types";
import { GAME_KEY } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wuliuqi/ui/components/table";
import { toast } from "@wuliuqi/ui/components/sonner";
import {
  Eye,
  Gamepad2,
  Globe2,
  MessageCircle,
  MessagesSquare,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchTrafficStatistics } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";
import { formatPrice } from "@/lib/format";

type TrafficMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

const rangeOptions: Array<{ label: string; value: TrafficRange }> = [
  { label: "近 7 天", value: "7d" },
  { label: "近 30 天", value: "30d" },
  { label: "近 90 天", value: "90d" },
];
const gameOptions: Array<{ label: string; value: TrafficGameFilter }> = [
  { label: "全部游戏", value: "all" },
  { label: "CODM", value: GAME_KEY.codm },
  { label: "三国杀", value: GAME_KEY.sanguosha },
];
const numberFormatter = new Intl.NumberFormat("zh-CN");
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const tooltipContentStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
};

export function TrafficStatisticsPage() {
  const [range, setRange] = useState<TrafficRange>("30d");
  const [gameKey, setGameKey] = useState<TrafficGameFilter>("all");
  const [statistics, setStatistics] = useState<AdminTrafficStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStatistics = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        setStatistics(
          await fetchTrafficStatistics({ range, game_key: gameKey }),
        );
      } catch (loadError) {
        const message = errorMessage(loadError, "加载流量统计失败");
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [gameKey, range],
  );

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">流量统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            分析账号详情的访问规模、购买意向与咨询行为，以及用户来源与设备分布。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select
            value={range}
            onValueChange={(value) => setRange(value as TrafficRange)}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={gameKey}
            onValueChange={(value) => setGameKey(value as TrafficGameFilter)}
          >
            <SelectTrigger className="w-full sm:w-32">
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
          <Button
            className="col-span-2 w-full sm:w-auto"
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
          <CardContent className="flex flex-col items-start gap-3 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void loadStatistics(true)}
            >
              重试
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {loading && !statistics ? <TrafficStatisticsSkeleton /> : null}
      {statistics ? <TrafficStatisticsContent statistics={statistics} /> : null}
    </div>
  );
}

function TrafficStatisticsContent({
  statistics,
}: {
  statistics: AdminTrafficStatistics;
}) {
  const metrics: TrafficMetric[] = [
    {
      label: "访问用户（按日）",
      value: formatNumber(statistics.summary.visitors),
      detail: "按日去重后汇总，跨日访问会重复计数",
      icon: Users,
    },
    {
      label: "账号详情浏览量",
      value: formatNumber(statistics.summary.views),
      detail: "账号详情成功加载的累计次数",
      icon: Eye,
    },
    {
      label: "闲鱼购买点击",
      value: formatNumber(statistics.summary.xianyuClicks),
      detail: "账号详情中“闲鱼购买”按钮的点击次数",
      icon: MousePointerClick,
    },
    {
      label: "微信咨询点击",
      value: formatNumber(statistics.summary.wechatContactClicks),
      detail: "“联系卖家”中微信联系方式的点击次数",
      icon: MessageCircle,
    },
    {
      label: "闲鱼咨询点击",
      value: formatNumber(statistics.summary.xianyuContactClicks),
      detail: "“联系卖家”中闲鱼联系方式的点击次数",
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <TrafficMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <TrafficTrendChart statistics={statistics} />

      <div className="grid gap-3 md:grid-cols-3">
        <TrafficBreakdownCard
          icon={Gamepad2}
          kind="game"
          rows={statistics.gameBreakdown}
          title="游戏访问分布"
        />
        <TrafficBreakdownCard
          icon={Globe2}
          kind="referrer"
          rows={statistics.breakdowns.referrers}
          title="访问来源"
        />
        <TrafficBreakdownCard
          icon={Monitor}
          kind="device"
          rows={statistics.breakdowns.devices}
          title="访问设备"
        />
      </div>

      <TopAccountsCard accounts={statistics.topAccounts} />

      <p className="text-right text-xs text-muted-foreground">
        更新于 {formatDateTime(statistics.generatedAt)}
      </p>
    </div>
  );
}

function TrafficMetricCard({ metric }: { metric: TrafficMetric }) {
  const Icon = metric.icon;

  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="flex items-start gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-foreground">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{metric.label}</div>
          <div className="mt-1 font-mono text-2xl font-bold">
            {metric.value}
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {metric.detail}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficTrendChart({
  statistics,
}: {
  statistics: AdminTrafficStatistics;
}) {
  return (
    <Card className="rounded-md shadow-none">
      <CardHeader>
        <CardTitle className="text-base">访问与互动趋势</CardTitle>
        <CardDescription>
          按日对比访问用户、详情浏览及购买与咨询行为。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statistics.trend.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                accessibilityLayer
                data={statistics.trend}
                margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelFormatter={(value) =>
                    formatChartDate(String(value ?? ""))
                  }
                />
                <Legend />
                <Line
                  dataKey="visitors"
                  dot={false}
                  name="访问用户（按日）"
                  stroke="#6b6b66"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="views"
                  dot={false}
                  name="详情浏览"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="xianyuClicks"
                  dot={false}
                  name="闲鱼购买"
                  stroke="var(--price)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="contactClicks"
                  dot={false}
                  name="咨询点击"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="当前筛选范围内暂无流量趋势" />
        )}
      </CardContent>
    </Card>
  );
}

function TrafficBreakdownCard({
  icon: Icon,
  kind,
  rows,
  title,
}: {
  icon: LucideIcon;
  kind: "device" | "game" | "referrer";
  rows: TrafficBreakdownRow[];
  title: string;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 0);

  return (
    <Card className="rounded-md shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon size={17} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div className="space-y-1.5" key={row.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate" title={row.label}>
                  {formatBreakdownLabel(kind, row.label)}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {formatNumber(row.value)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{
                    width: `${maxValue > 0 ? (row.value / maxValue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="暂无数据" />
        )}
      </CardContent>
    </Card>
  );
}

function TopAccountsCard({ accounts }: { accounts: TrafficTopAccount[] }) {
  return (
    <Card className="rounded-md shadow-none">
      <CardHeader>
        <CardTitle className="text-base">账号关注度排行</CardTitle>
        <CardDescription>
          按账号详情浏览量降序排列，重点关注“有浏览、无互动”的账号。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>账号</TableHead>
                    <TableHead>游戏</TableHead>
                    <TableHead className="text-right">价格</TableHead>
                    <TableHead className="text-right">访问用户</TableHead>
                    <TableHead className="text-right">浏览量</TableHead>
                    <TableHead className="text-right">闲鱼购买</TableHead>
                    <TableHead className="text-right">咨询点击</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.accountKey}>
                      <TableCell>
                        <div className="max-w-72">
                          <div className="font-mono text-xs text-muted-foreground">
                            {account.serialNumber}
                          </div>
                          <div className="mt-1 truncate font-medium">
                            {account.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <GameBadge gameKey={account.gameKey} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPrice(account.price)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(account.visitors)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(account.views)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(account.xianyuClicks)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(account.contactClicks)}
                      </TableCell>
                      <TableCell>
                        <AccountAttention account={account} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AccountLink account={account} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {accounts.map((account) => (
                <div
                  className="rounded-md border border-border p-3"
                  key={account.accountKey}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">
                        {account.serialNumber}
                      </div>
                      <div className="mt-1 truncate font-medium">
                        {account.title}
                      </div>
                    </div>
                    <GameBadge gameKey={account.gameKey} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <MobileMetric
                      label="访问用户（按日）"
                      value={account.visitors}
                    />
                    <MobileMetric label="详情浏览量" value={account.views} />
                    <MobileMetric
                      label="闲鱼购买"
                      value={account.xianyuClicks}
                    />
                    <MobileMetric
                      label="咨询点击"
                      value={account.contactClicks}
                    />
                  </div>
                  <div className="mt-3">
                    <AccountAttention account={account} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="font-mono text-sm text-price">
                      {formatPrice(account.price)}
                    </span>
                    <AccountLink account={account} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState text="当前筛选范围内暂无账号详情数据" />
        )}
      </CardContent>
    </Card>
  );
}

function AccountLink({ account }: { account: TrafficTopAccount }) {
  return (
    <Link
      className="text-sm font-medium hover:underline"
      href={`/accounts/${account.accountId}/edit?game_key=${account.gameKey}&mode=view`}
      scroll={false}
    >
      查看
    </Link>
  );
}

function AccountAttention({ account }: { account: TrafficTopAccount }) {
  const hasAction = account.xianyuClicks + account.contactClicks > 0;

  return (
    <Badge
      className="whitespace-nowrap"
      variant={hasAction ? "secondary" : "outline"}
    >
      {hasAction ? "已有互动" : "有浏览，无互动"}
    </Badge>
  );
}

function GameBadge({ gameKey }: { gameKey: TrafficTopAccount["gameKey"] }) {
  return (
    <Badge className="shrink-0" variant="secondary">
      {gameKey === GAME_KEY.sanguosha ? "三国杀" : "CODM"}
    </Badge>
  );
}

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md bg-muted p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono font-semibold">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-28 place-items-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function TrafficStatisticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-64" key={index} />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatChartDate(value: string | number) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : dateFormatter.format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function formatBreakdownLabel(
  kind: "device" | "game" | "referrer",
  label: string,
) {
  if (kind === "referrer" && (label === "$direct" || label === "direct")) {
    return "直接访问（书签或手动输入）";
  }

  if (kind === "device") {
    return (
      {
        Desktop: "电脑",
        Mobile: "手机",
        Tablet: "平板",
      }[label] ?? label
    );
  }

  return label;
}
