"use client";

import {
  ACCOUNT_SORT,
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_LABELS,
  DEFAULT_GAME_KEY,
  GAME_KEY,
} from "@wuliuqi/types";
import type { AccountSort, AdminAccount, GameKey } from "@wuliuqi/types";
import { ConfigProvider, Table as AntTable } from "antd";
import type { TableProps as AntTableProps } from "antd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@wuliuqi/ui/components/alert-dialog";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { Card } from "@wuliuqi/ui/components/card";
import { DateRangePicker } from "@wuliuqi/ui/components/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wuliuqi/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wuliuqi/ui/components/dialog";
import { Input } from "@wuliuqi/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Edit,
  Eye,
  Gamepad2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Swords,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CellTooltip } from "@/components/cell-tooltip";
import { AccountStatusBadge } from "@/components/status-badge";
import {
  deleteAccount,
  fetchAccounts,
  sellAccount,
  updateAccountStatus,
} from "@/lib/client-api";
import { ADMIN_ACCOUNTS_CHANGED_EVENT } from "@/lib/events";
import { errorMessage } from "@/lib/feedback";
import { formatDate, formatPrice } from "@/lib/format";

const ACCOUNT_PAGE_SIZE_OPTIONS = [20, 30, 40] as const;
const DEFAULT_ACCOUNT_PAGE_SIZE = ACCOUNT_PAGE_SIZE_OPTIONS[0];
const MOBILE_VIEWPORT_QUERY = "(max-width: 639px)";
const ACCOUNT_TABLE_SCROLL_X = 1776;
const ACCOUNT_TABLE_SCROLL_Y = 520;
const INITIAL_ACCOUNT_TABLE_SKELETON_ROW_COUNT = 10;
const ACCOUNT_DATE_RANGE = {
  all: "all",
  today: "today",
  thisWeek: "this_week",
  thisMonth: "this_month",
  lastMonth: "last_month",
  last7Days: "last_7_days",
  last30Days: "last_30_days",
  custom: "custom",
} as const;
type AccountDateRange =
  (typeof ACCOUNT_DATE_RANGE)[keyof typeof ACCOUNT_DATE_RANGE];
const accountDateRangeOptions: Array<{
  label: string;
  value: AccountDateRange;
}> = [
  { label: "全部日期", value: ACCOUNT_DATE_RANGE.all },
  { label: "今天", value: ACCOUNT_DATE_RANGE.today },
  { label: "本周", value: ACCOUNT_DATE_RANGE.thisWeek },
  { label: "本月", value: ACCOUNT_DATE_RANGE.thisMonth },
  { label: "上月", value: ACCOUNT_DATE_RANGE.lastMonth },
  { label: "近 7 天", value: ACCOUNT_DATE_RANGE.last7Days },
  { label: "近 30 天", value: ACCOUNT_DATE_RANGE.last30Days },
];
const gameOptions: Array<{ label: string; value: GameKey }> = [
  { label: "CODM", value: GAME_KEY.codm },
  { label: "三国杀", value: GAME_KEY.sanguosha },
];
const initialAccountTableSkeletonRows: AdminAccount[] = Array.from(
  { length: INITIAL_ACCOUNT_TABLE_SKELETON_ROW_COUNT },
  (_, index) => ({
    id: -(index + 1),
    gameKey: DEFAULT_GAME_KEY,
    serialNumber: "",
    images: [],
    attributes: {},
    attributeValues: [],
    price: 0,
    costPrice: 0,
    title: "",
    description: "",
    xianyuUrl: "",
    email: "",
    status: ACCOUNT_STATUS.listed,
  }),
);

type LoadMode = "append" | "replace";
type AccountTableColumns = NonNullable<AntTableProps<AdminAccount>["columns"]>;
type AccountPendingAction = {
  accountId: number;
  name: "delete" | "sell" | "status";
} | null;

function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_VIEWPORT_QUERY).matches
  );
}

function getAccountDateRangeBounds(
  range: AccountDateRange,
  customRange: { from: string; to: string },
  now = new Date(),
) {
  if (range === ACCOUNT_DATE_RANGE.custom) {
    if (!customRange.from || !customRange.to) {
      return {};
    }

    const from = new Date(`${customRange.from}T00:00:00`);
    const to = new Date(`${customRange.to}T23:59:59.999`);

    return {
      updatedFrom: from.toISOString(),
      updatedTo: to.toISOString(),
    };
  }

  const selectedRange = getAccountDateRangeDates(range, now);

  if (!selectedRange?.from || !selectedRange.to) {
    return {};
  }

  return {
    updatedFrom: selectedRange.from.toISOString(),
    updatedTo: selectedRange.to.toISOString(),
  };
}

function getAccountDateRangeDates(
  range: AccountDateRange,
  now = new Date(),
) {
  if (
    range === ACCOUNT_DATE_RANGE.all ||
    range === ACCOUNT_DATE_RANGE.custom
  ) {
    return undefined;
  }

  const from = new Date(now);
  const to = new Date(now);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  if (range === ACCOUNT_DATE_RANGE.thisWeek) {
    const daysSinceMonday = (from.getDay() + 6) % 7;
    from.setDate(from.getDate() - daysSinceMonday);
  } else if (range === ACCOUNT_DATE_RANGE.thisMonth) {
    from.setDate(1);
  } else if (range === ACCOUNT_DATE_RANGE.lastMonth) {
    from.setDate(1);
    from.setMonth(from.getMonth() - 1);
    to.setDate(0);
  } else if (range === ACCOUNT_DATE_RANGE.last7Days) {
    from.setDate(from.getDate() - 6);
  } else if (range === ACCOUNT_DATE_RANGE.last30Days) {
    from.setDate(from.getDate() - 29);
  }

  return { from, to };
}

function dateFromInputValue(value: string) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function dateToInputValue(value?: Date) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [gameKeyValue, setGameKeyValue] = useState<GameKey>(DEFAULT_GAME_KEY);
  const [gameKey, setGameKey] = useState<GameKey>(DEFAULT_GAME_KEY);
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusValue, setStatusValue] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortValue, setSortValue] = useState<AccountSort>(ACCOUNT_SORT.latest);
  const [sort, setSort] = useState<AccountSort>(ACCOUNT_SORT.latest);
  const [dateRangeValue, setDateRangeValue] = useState<AccountDateRange>(
    ACCOUNT_DATE_RANGE.all,
  );
  const [dateRange, setDateRange] = useState<AccountDateRange>(
    ACCOUNT_DATE_RANGE.all,
  );
  const [customDateFromValue, setCustomDateFromValue] = useState("");
  const [customDateToValue, setCustomDateToValue] = useState("");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_ACCOUNT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [pendingAction, setPendingAction] =
    useState<AccountPendingAction>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [sellTarget, setSellTarget] = useState<AdminAccount | null>(null);
  const [soldPriceValue, setSoldPriceValue] = useState("");
  const [gameSelectorOpen, setGameSelectorOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const totalPagesRef = useRef(0);
  const errorRef = useRef("");

  const fetchAccountPage = useCallback(
    (nextPage: number) => {
      const { updatedFrom, updatedTo } = getAccountDateRangeBounds(
        dateRange,
        customDateRange,
      );

      return fetchAccounts({
        game_key: gameKey,
        keyword: keyword || undefined,
        limit: pageSize,
        page: nextPage,
        sort,
        status:
          status === "all"
            ? undefined
            : (Number(status) as AdminAccount["status"]),
        updated_from: updatedFrom,
        updated_to: updatedTo,
      });
    },
    [customDateRange, dateRange, gameKey, keyword, pageSize, sort, status],
  );

  const applyPagination = useCallback(
    (pagination: { page: number; total: number; totalPages: number }) => {
      setPage(pagination.page);
      pageRef.current = pagination.page;
      setTotal(pagination.total);
      setTotalPages(pagination.totalPages);
      totalPagesRef.current = pagination.totalPages;
    },
    [],
  );

  const loadPage = useCallback(
    async (nextPage: number, mode: LoadMode = "replace") => {
      const requestId = ++requestIdRef.current;

      loadingRef.current = true;
      errorRef.current = "";
      setLoading(true);
      setError("");

      try {
        const result = await fetchAccountPage(nextPage);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setAccounts((current) =>
          mode === "append" ? [...current, ...result.list] : result.list,
        );
        applyPagination(result.pagination);
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = errorMessage(loadError, "加载失败");
        errorRef.current = message;
        setError(message);
        toast.error(message);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [applyPagination, fetchAccountPage],
  );

  const loadLoadedPages = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    loadingRef.current = true;
    errorRef.current = "";
    setLoading(true);
    setError("");

    try {
      const firstResult = await fetchAccountPage(1);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextTotalPages = firstResult.pagination.totalPages;
      const targetPage = Math.min(
        Math.max(pageRef.current, 1),
        Math.max(nextTotalPages, 1),
      );
      const nextAccounts = [...firstResult.list];
      let latestPagination = {
        ...firstResult.pagination,
        page: targetPage,
      };

      for (let nextPage = 2; nextPage <= targetPage; nextPage += 1) {
        const result = await fetchAccountPage(nextPage);

        if (requestId !== requestIdRef.current) {
          return;
        }

        nextAccounts.push(...result.list);
        latestPagination = result.pagination;
      }

      setAccounts(nextAccounts);
      applyPagination({
        page: targetPage,
        total: firstResult.pagination.total,
        totalPages: latestPagination.totalPages,
      });
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message = errorMessage(loadError, "加载失败");
      errorRef.current = message;
      setError(message);
      toast.error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [applyPagination, fetchAccountPage]);

  const reloadCurrentView = useCallback(async () => {
    if (isMobileViewport()) {
      await loadLoadedPages();
      return;
    }

    await loadPage(Math.max(pageRef.current, 1), "replace");
  }, [loadLoadedPages, loadPage]);

  useEffect(() => {
    void loadPage(1, "replace");
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
          void loadPage(pageRef.current + 1, "append");
        }
      },
      { rootMargin: "420px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [loadPage]);

  useEffect(() => {
    function handleAccountsChanged() {
      void reloadCurrentView();
    }

    window.addEventListener(
      ADMIN_ACCOUNTS_CHANGED_EVENT,
      handleAccountsChanged,
    );

    return () =>
      window.removeEventListener(
        ADMIN_ACCOUNTS_CHANGED_EVENT,
        handleAccountsChanged,
      );
  }, [reloadCurrentView]);

  function handleSearch() {
    if (loadingRef.current) {
      return;
    }

    const nextKeyword = searchValue.trim();
    const nextGameKey = gameKeyValue;
    const nextStatus = statusValue;
    const nextSort = sortValue;
    const nextDateRange = dateRangeValue;
    const nextCustomDateFrom =
      nextDateRange === ACCOUNT_DATE_RANGE.custom ? customDateFromValue : "";
    const nextCustomDateTo =
      nextDateRange === ACCOUNT_DATE_RANGE.custom ? customDateToValue : "";

    if (
      nextDateRange === ACCOUNT_DATE_RANGE.custom &&
      (!nextCustomDateFrom || !nextCustomDateTo)
    ) {
      toast.error("请选择完整的开始和结束日期");
      return;
    }

    if (nextCustomDateFrom > nextCustomDateTo) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }

    if (
      nextKeyword === keyword &&
      nextGameKey === gameKey &&
      nextStatus === status &&
      nextSort === sort &&
      nextDateRange === dateRange &&
      nextCustomDateFrom === customDateRange.from &&
      nextCustomDateTo === customDateRange.to
    ) {
      void loadPage(1, "replace");
      return;
    }

    setKeyword(nextKeyword);
    setGameKey(nextGameKey);
    setStatus(nextStatus);
    setSort(nextSort);
    setDateRange(nextDateRange);
    setCustomDateRange({
      from: nextCustomDateFrom,
      to: nextCustomDateTo,
    });
  }

  function handleResetFilters() {
    if (loadingRef.current) {
      return;
    }

    setSearchValue("");
    setGameKeyValue(DEFAULT_GAME_KEY);
    setStatusValue("all");
    setSortValue(ACCOUNT_SORT.latest);
    setDateRangeValue(ACCOUNT_DATE_RANGE.all);
    setCustomDateFromValue("");
    setCustomDateToValue("");

    if (
      keyword === "" &&
      gameKey === DEFAULT_GAME_KEY &&
      status === "all" &&
      sort === ACCOUNT_SORT.latest &&
      dateRange === ACCOUNT_DATE_RANGE.all &&
      customDateRange.from === "" &&
      customDateRange.to === ""
    ) {
      void loadPage(1, "replace");
      return;
    }

    setKeyword("");
    setGameKey(DEFAULT_GAME_KEY);
    setStatus("all");
    setSort(ACCOUNT_SORT.latest);
    setDateRange(ACCOUNT_DATE_RANGE.all);
    setCustomDateRange({ from: "", to: "" });
  }

  async function toggleStatus(account: AdminAccount) {
    if (pendingAction !== null || account.status === ACCOUNT_STATUS.sold) {
      return;
    }

    setPendingAction({ accountId: account.id, name: "status" });
    setError("");

    try {
      await updateAccountStatus(
        account.id,
        account.status === ACCOUNT_STATUS.listed
          ? ACCOUNT_STATUS.unlisted
          : ACCOUNT_STATUS.listed,
        account.gameKey,
      );
      await reloadCurrentView();
      toast.success(
        account.status === ACCOUNT_STATUS.listed ? "账号已下架" : "账号已上架",
      );
    } catch (toggleError) {
      const message = errorMessage(toggleError, "更新失败");
      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  function openSellDialog(account: AdminAccount) {
    setSellTarget(account);
    setSoldPriceValue(String(account.price));
  }

  async function confirmSellAccount() {
    if (!sellTarget || pendingAction !== null) {
      return;
    }

    const soldPrice = Number(soldPriceValue);

    if (
      soldPriceValue.trim() === "" ||
      !Number.isFinite(soldPrice) ||
      soldPrice < 0
    ) {
      toast.error("请输入有效的成交价");
      return;
    }

    setPendingAction({ accountId: sellTarget.id, name: "sell" });
    setError("");

    try {
      await sellAccount(sellTarget.id, soldPrice, sellTarget.gameKey);
      await reloadCurrentView();
      setSellTarget(null);
      setSoldPriceValue("");
      toast.success("账号已出售，邮箱已解绑");
    } catch (sellError) {
      const message = errorMessage(sellError, "出售失败");
      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmRemoveAccount() {
    if (!deleteTarget || pendingAction !== null) {
      return;
    }

    setPendingAction({ accountId: deleteTarget.id, name: "delete" });
    setError("");

    try {
      await deleteAccount(deleteTarget.id, deleteTarget.gameKey);
      await reloadCurrentView();
      setDeleteTarget(null);
      toast.success("账号已删除");
    } catch (deleteError) {
      const message = errorMessage(deleteError, "删除失败");
      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  const isInitialLoading = loading && accounts.length === 0;
  const statusActionId =
    pendingAction?.name === "status" ? pendingAction.accountId : null;
  const sellActionId =
    pendingAction?.name === "sell" ? pendingAction.accountId : null;
  const deletingId =
    pendingAction?.name === "delete" ? pendingAction.accountId : null;
  const isMutating = pendingAction !== null;

  function renderAccountActions(account: AdminAccount) {
    const isSold = account.status === ACCOUNT_STATUS.sold;
    const statusIcon =
      statusActionId === account.id ? (
        <Spinner />
      ) : isSold ? (
        <CheckCircle2 size={15} />
      ) : account.status === ACCOUNT_STATUS.listed ? (
        <Download size={15} />
      ) : (
        <Upload size={15} />
      );
    const statusLabel = isSold
      ? ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.sold]
      : account.status === ACCOUNT_STATUS.listed
        ? "下架"
        : "上架";

    return (
      <div className="flex justify-end gap-1">
        {isSold ? (
          <Button
            asChild
            className="h-8 gap-1 px-1.5 !text-foreground hover:!text-foreground"
            size="sm"
            variant="ghost"
          >
            <Link
              href={`/accounts/${account.id}/edit?game_key=${account.gameKey}&mode=view`}
              scroll={false}
            >
              <Eye size={15} />
              查看
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className="h-8 gap-1 px-1.5 !text-foreground hover:!text-foreground"
            size="sm"
            variant="ghost"
          >
            <Link
              href={`/accounts/${account.id}/edit?game_key=${account.gameKey}`}
              scroll={false}
            >
              <Edit size={15} />
              编辑
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 gap-1 px-1.5"
              size="sm"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal size={15} />
              更多
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              disabled={isMutating || isSold}
              onSelect={() => {
                void toggleStatus(account);
              }}
            >
              {statusIcon}
              {statusLabel}
            </DropdownMenuItem>
            {!isSold ? (
              <DropdownMenuItem
                disabled={isMutating}
                onSelect={() => openSellDialog(account)}
              >
                {sellActionId === account.id ? (
                  <Spinner />
                ) : (
                  <CircleDollarSign size={15} />
                )}
                出售
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isMutating}
              variant="destructive"
              onSelect={() => setDeleteTarget(account)}
            >
              {deletingId === account.id ? <Spinner /> : <Trash2 size={15} />}
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const accountTableColumns: AccountTableColumns = [
    {
      dataIndex: "title",
      key: "account",
      title: "账号",
      width: 320,
      render: (_value, account) => (
        <div className="flex min-w-72 items-center gap-3">
          <div className="relative size-14 overflow-hidden rounded-md border border-border bg-muted">
            {account.images[0] ? (
              <Image
                fill
                alt={account.title}
                className="object-cover"
                sizes="56px"
                src={account.images[0]}
                unoptimized
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <CellTooltip className="font-medium" content={account.title}>
              {account.title}
            </CellTooltip>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge className="rounded-sm" variant="secondary">
                {account.serialNumber}
              </Badge>
              {account.images.length} 图
            </div>
          </div>
        </div>
      ),
    },
    {
      dataIndex: "attributeValues",
      key: "attributes",
      title: "属性",
      width: 224,
      render: (_value, account) => <AccountAttributeBadges account={account} />,
    },
    {
      dataIndex: "price",
      key: "price",
      title: "售价",
      width: 112,
      render: (_value, account) => (
        <CellTooltip content={formatPrice(account.price)}>
          <span className="font-mono font-semibold text-price">
            {formatPrice(account.price)}
          </span>
        </CellTooltip>
      ),
    },
    {
      dataIndex: "costPrice",
      key: "costPrice",
      title: "成本",
      width: 112,
      render: (_value, account) => (
        <CellTooltip content={formatPrice(account.costPrice)}>
          <span className="font-mono text-muted-foreground">
            {formatPrice(account.costPrice)}
          </span>
        </CellTooltip>
      ),
    },
    {
      dataIndex: "soldPrice",
      key: "soldPrice",
      title: "成交价",
      width: 112,
      render: (_value, account) =>
        account.status === ACCOUNT_STATUS.sold ? (
          <CellTooltip content={formatPrice(account.soldPrice ?? 0)}>
            <span className="font-mono text-muted-foreground">
              {formatPrice(account.soldPrice ?? 0)}
            </span>
          </CellTooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      dataIndex: "profit",
      key: "profit",
      title: "利润",
      width: 112,
      render: (_value, account) =>
        account.status === ACCOUNT_STATUS.sold &&
        account.profit !== undefined ? (
          <CellTooltip content={formatPrice(account.profit)}>
            <span className="font-mono text-muted-foreground">
              {formatPrice(account.profit)}
            </span>
          </CellTooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      dataIndex: "email",
      key: "email",
      title: "邮箱",
      width: 256,
      render: (_value, account) => (
        <CellTooltip content={account.email || "-"}>
          <span className="text-muted-foreground">{account.email || "-"}</span>
        </CellTooltip>
      ),
    },
    {
      dataIndex: "status",
      key: "status",
      title: "状态",
      width: 96,
      render: (_value, account) => (
        <AccountStatusBadge status={account.status} />
      ),
    },
    {
      dataIndex: "updatedAt",
      key: "updatedAt",
      title: "更新",
      width: 144,
      render: (_value, account) => (
        <CellTooltip content={formatDate(account.updatedAt)}>
          <span className="text-muted-foreground">
            {formatDate(account.updatedAt)}
          </span>
        </CellTooltip>
      ),
    },
    {
      align: "right",
      fixed: "right",
      key: "actions",
      title: "操作",
      width: 144,
      render: (_value, account) => renderAccountActions(account),
    },
  ];
  const accountTableSkeletonColumns: AccountTableColumns = [
    {
      key: "account",
      title: "账号",
      width: 320,
      render: () => (
        <div className="flex min-w-72 items-center gap-3">
          <Skeleton className="size-14 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ),
    },
    {
      key: "attributes",
      title: "属性",
      width: 224,
      render: () => (
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ),
    },
    {
      key: "price",
      title: "售价",
      width: 112,
      render: () => <Skeleton className="h-4 w-16" />,
    },
    {
      key: "costPrice",
      title: "成本",
      width: 112,
      render: () => <Skeleton className="h-4 w-16" />,
    },
    {
      key: "soldPrice",
      title: "成交价",
      width: 112,
      render: () => <Skeleton className="h-4 w-16" />,
    },
    {
      key: "profit",
      title: "利润",
      width: 112,
      render: () => <Skeleton className="h-4 w-16" />,
    },
    {
      key: "email",
      title: "邮箱",
      width: 256,
      render: () => <Skeleton className="h-4 w-3/4" />,
    },
    {
      key: "status",
      title: "状态",
      width: 96,
      render: () => <Skeleton className="h-5 w-14 rounded-full" />,
    },
    {
      key: "updatedAt",
      title: "更新",
      width: 144,
      render: () => <Skeleton className="h-4 w-24" />,
    },
    {
      align: "right",
      fixed: "right",
      key: "actions",
      title: "操作",
      width: 144,
      render: () => (
        <div className="flex justify-end">
          <Skeleton className="h-8 w-16" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">账号运营</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 个账号，当前显示 {accounts.length} 个
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          type="button"
          onClick={() => setGameSelectorOpen(true)}
        >
          <Plus size={16} />
          新建账号
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card p-3 shadow-xs">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_150px_230px_auto]">
          <form
            className="min-w-0"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 rounded-md bg-background pl-9"
                placeholder="搜索标题、序号、描述、邮箱"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </form>
          <Select
            value={gameKeyValue}
            onValueChange={(value) => setGameKeyValue(value as GameKey)}
          >
            <SelectTrigger className="h-9 rounded-md">
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
          <Select value={statusValue} onValueChange={setStatusValue}>
            <SelectTrigger className="h-9 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value={String(ACCOUNT_STATUS.listed)}>
                上架
              </SelectItem>
              <SelectItem value={String(ACCOUNT_STATUS.unlisted)}>
                下架
              </SelectItem>
              <SelectItem value={String(ACCOUNT_STATUS.sold)}>
                {ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.sold]}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortValue}
            onValueChange={(value) => setSortValue(value as AccountSort)}
          >
            <SelectTrigger className="h-9 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ACCOUNT_SORT.latest}>最近更新</SelectItem>
              <SelectItem value={ACCOUNT_SORT.priceDesc}>
                价格从高到低
              </SelectItem>
              <SelectItem value={ACCOUNT_SORT.priceAsc}>
                价格从低到高
              </SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            className="h-9 rounded-md"
            disabled={loading}
            presets={accountDateRangeOptions.map((option) => ({
              ...option,
              range: getAccountDateRangeDates(option.value),
            }))}
            selectedPreset={
              dateRangeValue === ACCOUNT_DATE_RANGE.custom
                ? undefined
                : dateRangeValue
            }
            value={
              dateRangeValue === ACCOUNT_DATE_RANGE.custom
                ? customDateFromValue || customDateToValue
                  ? {
                      from: dateFromInputValue(customDateFromValue),
                      to: dateFromInputValue(customDateToValue),
                    }
                  : undefined
                : getAccountDateRangeDates(dateRangeValue)
            }
            onChange={(value) => {
              setDateRangeValue(ACCOUNT_DATE_RANGE.custom);
              setCustomDateFromValue(dateToInputValue(value?.from));
              setCustomDateToValue(dateToInputValue(value?.to));
            }}
            onPresetChange={(value) => {
              setDateRangeValue(value as AccountDateRange);
              setCustomDateFromValue("");
              setCustomDateToValue("");
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-9 rounded-md bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
              disabled={loading}
              title="搜索账号"
              type="button"
              onClick={handleSearch}
            >
              {loading ? <Spinner /> : <Search size={15} />}
              {loading ? "搜索中..." : "搜索"}
            </Button>
            <Button
              className="h-9 rounded-md border-border bg-background px-3 text-xs"
              disabled={loading}
              title="重置账号筛选"
              type="button"
              variant="outline"
              onClick={handleResetFilters}
            >
              <RotateCcw size={15} />
              重置
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:hidden">
        {isInitialLoading ? <MobileAccountSkeletons /> : null}
        {accounts.map((account) => {
          const isSold = account.status === ACCOUNT_STATUS.sold;

          return (
            <div
              className="rounded-md border border-border bg-card p-3"
              key={account.id}
            >
              <div className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {account.images[0] ? (
                    <Image
                      fill
                      alt={account.title}
                      className="object-cover"
                      sizes="64px"
                      src={account.images[0]}
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{account.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge className="rounded-sm" variant="secondary">
                      {account.serialNumber}
                    </Badge>
                    {account.images.length} 图
                  </div>
                  <MobileAccountAttributeBadges account={account} />
                  <div className="mt-2 font-mono text-sm font-semibold text-price">
                    {formatPrice(account.price)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    成本 {formatPrice(account.costPrice)}
                    {account.status === ACCOUNT_STATUS.sold
                      ? ` / 成交 ${formatPrice(account.soldPrice ?? 0)}`
                      : ""}
                  </div>
                  <div className="mt-2 truncate text-xs text-muted-foreground">
                    {account.email || "-"}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0 text-xs text-muted-foreground">
                  <span className="mr-2">更新</span>
                  {formatDate(account.updatedAt)}
                </div>
                <AccountStatusBadge status={account.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {isSold ? (
                  <Button
                    asChild
                    className="min-w-0 flex-1"
                    size="sm"
                    variant="outline"
                  >
                    <Link
                      href={`/accounts/${account.id}/edit?game_key=${account.gameKey}&mode=view`}
                      scroll={false}
                    >
                      <Eye size={15} />
                      查看
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="min-w-0 flex-1"
                    size="sm"
                    variant="outline"
                  >
                    <Link
                      href={`/accounts/${account.id}/edit?game_key=${account.gameKey}`}
                      scroll={false}
                    >
                      <Edit size={15} />
                      编辑
                    </Link>
                  </Button>
                )}
                <Button
                  className="min-w-0 flex-1"
                  disabled={isMutating || isSold}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => toggleStatus(account)}
                >
                  {statusActionId === account.id ? (
                    <Spinner />
                  ) : isSold ? (
                    <CheckCircle2 size={15} />
                  ) : account.status === ACCOUNT_STATUS.listed ? (
                    <Download size={15} />
                  ) : (
                    <Upload size={15} />
                  )}
                  {isSold
                    ? ACCOUNT_STATUS_LABELS[ACCOUNT_STATUS.sold]
                    : account.status === ACCOUNT_STATUS.listed
                      ? "下架"
                      : "上架"}
                </Button>
                {!isSold ? (
                  <Button
                    className="min-w-0 flex-1"
                    disabled={isMutating}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => openSellDialog(account)}
                  >
                    {sellActionId === account.id ? (
                      <Spinner />
                    ) : (
                      <CircleDollarSign size={15} />
                    )}
                    出售
                  </Button>
                ) : null}
                <Button
                  aria-label={`删除账号 ${account.serialNumber}`}
                  disabled={isMutating}
                  size="sm"
                  title={`删除账号 ${account.serialNumber}`}
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteTarget(account)}
                >
                  {deletingId === account.id ? (
                    <Spinner />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        {!loading && accounts.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无账号
          </div>
        ) : null}
        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center py-4"
        >
          {loading && accounts.length > 0 ? (
            <LoadingLine label="正在加载更多" />
          ) : accounts.length > 0 && page >= totalPages ? (
            <span className="text-sm text-muted-foreground">没有更多了</span>
          ) : accounts.length > 0 ? (
            <span className="text-sm text-muted-foreground">下滑加载更多</span>
          ) : null}
        </div>
      </div>

      <Card className="hidden overflow-hidden rounded-md shadow-none sm:block">
        <ConfigProvider
          theme={{
            components: {
              Table: {
                borderColor: "var(--border)",
                cellPaddingBlock: 12,
                cellPaddingInline: 12,
                fixedHeaderSortActiveBg: "var(--card)",
                headerBg: "var(--card)",
                headerColor: "var(--muted-foreground)",
                rowHoverBg: "var(--accent)",
              },
            },
            token: {
              borderRadius: 6,
              colorBgContainer: "var(--card)",
              colorBorder: "var(--border)",
              colorFillAlter: "var(--muted)",
              colorPrimary: "var(--primary)",
              colorSplit: "var(--border)",
              colorText: "var(--card-foreground)",
              colorTextSecondary: "var(--muted-foreground)",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            },
          }}
        >
          <AntTable<AdminAccount>
            className={`admin-accounts-table${
              isInitialLoading ? " admin-table--initial-loading" : ""
            }`}
            columns={
              isInitialLoading
                ? accountTableSkeletonColumns
                : accountTableColumns
            }
            dataSource={
              isInitialLoading ? initialAccountTableSkeletonRows : accounts
            }
            loading={loading && !isInitialLoading}
            locale={{ emptyText: "暂无账号" }}
            pagination={false}
            rowKey="id"
            scroll={{
              x: ACCOUNT_TABLE_SCROLL_X,
              y: ACCOUNT_TABLE_SCROLL_Y,
            }}
            size="middle"
          />
        </ConfigProvider>
        {total > 0 ? (
          <AccountsPagination
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={(nextPage) => loadPage(nextPage, "replace")}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>
      <AlertDialog
        open={Boolean(sellTarget)}
        onOpenChange={(open) => {
          if (!open && sellActionId === null) {
            setSellTarget(null);
            setSoldPriceValue("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>出售账号</AlertDialogTitle>
            <AlertDialogDescription>
              确认出售账号 {sellTarget?.serialNumber}
              ？出售后会解绑邮箱并将邮箱恢复为未绑定状态，此操作不可逆。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">成交价</span>
            <Input
              min={0}
              step="0.01"
              type="number"
              value={soldPriceValue}
              onChange={(event) => setSoldPriceValue(event.target.value)}
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sellActionId !== null}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              disabled={
                sellActionId !== null ||
                soldPriceValue.trim() === "" ||
                !Number.isFinite(Number(soldPriceValue)) ||
                Number(soldPriceValue) < 0
              }
              onClick={(event) => {
                event.preventDefault();
                void confirmSellAccount();
              }}
            >
              {sellActionId !== null ? <Spinner /> : null}
              {sellActionId !== null ? "出售中..." : "确认出售"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={gameSelectorOpen} onOpenChange={setGameSelectorOpen}>
        <DialogContent className="max-w-md rounded-md">
          <DialogTitle>选择账号游戏</DialogTitle>
          <DialogDescription>
            选择要新增的游戏类型，系统会打开对应的账号表单。
          </DialogDescription>
          <div className="grid gap-3 sm:grid-cols-2">
            <GameCreateLink
              description="使命召唤手游账号"
              href="/accounts/codm/new"
              icon={<Gamepad2 size={22} />}
              label="CODM"
              onSelect={() => setGameSelectorOpen(false)}
            />
            <GameCreateLink
              description="三国杀账号"
              href="/accounts/sanguosha/new"
              icon={<Swords size={22} />}
              label="三国杀"
              onSelect={() => setGameSelectorOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingId === null) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除账号</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除账号 {deleteTarget?.serialNumber}？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              disabled={deletingId !== null}
              onClick={(event) => {
                event.preventDefault();
                void confirmRemoveAccount();
              }}
            >
              {deletingId !== null ? <Spinner /> : null}
              {deletingId !== null ? "删除中..." : "删除账号"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GameCreateLink({
  description,
  href,
  icon,
  label,
  onSelect,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}) {
  const isSanguosha = label === "三国杀";

  return (
    <Link
      className="group flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent"
      href={href}
      scroll={false}
      onClick={onSelect}
    >
      <span
        className={
          isSanguosha
            ? "grid size-11 shrink-0 place-items-center rounded-md bg-red-600 text-white"
            : "grid size-11 shrink-0 place-items-center rounded-md bg-orange-500 text-white"
        }
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </Link>
  );
}

function MobileAccountAttributeBadges({ account }: { account: AdminAccount }) {
  if (account.attributeValues.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {account.attributeValues.slice(0, 3).map((attribute) => (
        <Badge
          className="rounded-sm font-normal"
          key={attribute.key}
          variant="outline"
        >
          {attribute.label}
          {!attribute.enabled ? "（停用）" : ""}：{attribute.displayValue}
        </Badge>
      ))}
    </div>
  );
}

function AccountAttributeBadges({ account }: { account: AdminAccount }) {
  if (account.attributeValues.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const visibleAttributes = account.attributeValues.slice(0, 3);
  const hiddenCount = account.attributeValues.length - visibleAttributes.length;
  const tooltipContent = account.attributeValues
    .map(formatAccountAttribute)
    .join("；");

  return (
    <CellTooltip asChild content={tooltipContent}>
      <div className="flex max-w-56 flex-wrap gap-1">
        {visibleAttributes.map((attribute) => (
          <Badge
            className="max-w-full rounded-sm font-normal"
            key={attribute.key}
            variant="outline"
          >
            <span className="truncate">
              {formatAccountAttribute(attribute)}
            </span>
          </Badge>
        ))}
        {hiddenCount > 0 ? (
          <Badge className="rounded-sm font-normal" variant="secondary">
            +{hiddenCount}
          </Badge>
        ) : null}
      </div>
    </CellTooltip>
  );
}

function formatAccountAttribute(
  attribute: AdminAccount["attributeValues"][number],
) {
  return `${attribute.label}${attribute.enabled ? "" : "（停用）"}：${
    attribute.displayValue
  }`;
}

function LoadingLine({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </span>
  );
}

function MobileAccountSkeletons() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="rounded-md border border-border bg-card p-3" key={index}>
      <div className="flex gap-3">
        <Skeleton className="size-16 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  ));
}

function AccountsPagination({
  loading,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalPages,
}: {
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const pageItems = getPaginationItems(page, safeTotalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border px-4 py-3">
      <Button
        aria-label="上一页"
        className="size-8 p-0"
        disabled={loading || isFirstPage}
        size="sm"
        title="上一页"
        type="button"
        variant="ghost"
        onClick={() => onPageChange(Math.max(page - 1, 1))}
      >
        <ChevronLeft size={15} />
      </Button>
      {pageItems.map((item, index) =>
        item === "ellipsis" ? (
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center text-muted-foreground"
            key={`ellipsis-${index}`}
          >
            ...
          </span>
        ) : (
          <Button
            aria-current={item === page ? "page" : undefined}
            className={
              item === page
                ? "size-8 border-primary px-0 text-primary hover:bg-accent hover:text-primary"
                : "size-8 px-0"
            }
            disabled={loading || item === page}
            key={item}
            size="sm"
            type="button"
            variant={item === page ? "outline" : "ghost"}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        aria-label="下一页"
        className="size-8 p-0"
        disabled={loading || isLastPage}
        size="sm"
        title="下一页"
        type="button"
        variant="ghost"
        onClick={() => onPageChange(Math.min(page + 1, safeTotalPages))}
      >
        <ChevronRight size={15} />
      </Button>
      <Select
        disabled={loading}
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger
          aria-label="每页账号数量"
          className="ml-2 h-8 w-24 rounded-md text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNT_PAGE_SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size} 条/页
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getPaginationItems(page: number, totalPages: number) {
  const edgePageCount = 5;

  if (totalPages <= edgePageCount + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= edgePageCount - 1) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const;
  }

  if (page >= totalPages - (edgePageCount - 2)) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages] as const;
}
