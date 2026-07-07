"use client";

import type { AdminAccount } from "@wuliuqi/types";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wuliuqi/ui/components/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccountStatusBadge } from "@/components/status-badge";
import {
  deleteAccount,
  fetchAccounts,
  updateAccountStatus,
} from "@/lib/client-api";
import { ADMIN_ACCOUNTS_CHANGED_EVENT } from "@/lib/events";
import { errorMessage } from "@/lib/feedback";
import { formatDate, formatPrice } from "@/lib/format";

const ACCOUNT_PAGE_SIZE = 50;
const MOBILE_VIEWPORT_QUERY = "(max-width: 639px)";

type LoadMode = "append" | "replace";
type AccountPendingAction = {
  accountId: number;
  name: "delete" | "status";
} | null;

function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_VIEWPORT_QUERY).matches
  );
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [pendingAction, setPendingAction] =
    useState<AccountPendingAction>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const totalPagesRef = useRef(0);
  const errorRef = useRef("");

  const fetchAccountPage = useCallback(
    (nextPage: number) =>
      fetchAccounts({
        keyword: keyword || undefined,
        limit: ACCOUNT_PAGE_SIZE,
        page: nextPage,
        sort,
        status: status === "all" ? undefined : Number(status),
      }),
    [keyword, sort, status],
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

    if (nextKeyword === keyword) {
      void loadPage(1, "replace");
      return;
    }

    setKeyword(nextKeyword);
  }

  async function toggleStatus(account: AdminAccount) {
    if (pendingAction !== null) {
      return;
    }

    setPendingAction({ accountId: account.id, name: "status" });
    setError("");

    try {
      await updateAccountStatus(account.id, account.status === 1 ? 2 : 1);
      await reloadCurrentView();
      toast.success(account.status === 1 ? "账号已下架" : "账号已上架");
    } catch (toggleError) {
      const message = errorMessage(toggleError, "更新失败");
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
      await deleteAccount(deleteTarget.id);
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
  const deletingId =
    pendingAction?.name === "delete" ? pendingAction.accountId : null;
  const isMutating = pendingAction !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">账号运营</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 个账号，当前显示 {accounts.length} 个
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/accounts/new">
            <Plus size={16} />
            新建账号
          </Link>
        </Button>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-[minmax(220px,1fr)_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="搜索标题、序号、描述、邮箱"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="1">上架</SelectItem>
              <SelectItem value="2">下架</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最近更新</SelectItem>
              <SelectItem value="price_desc">价格从高到低</SelectItem>
              <SelectItem value="price_asc">价格从低到高</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={loading}
            type="button"
            variant="outline"
            onClick={handleSearch}
          >
            <RefreshCw size={16} />
            刷新
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
        {isInitialLoading ? <MobileAccountSkeletons /> : null}
        {accounts.map((account) => (
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
                <div className="mt-2 font-mono text-sm font-semibold text-price">
                  {formatPrice(account.price)}
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
            <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/accounts/${account.id}/edit`} scroll={false}>
                  <Edit size={15} />
                  编辑
                </Link>
              </Button>
              <Button
                disabled={isMutating}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => toggleStatus(account)}
              >
                {statusActionId === account.id ? <Spinner /> : null}
                {account.status === 1 ? "下架" : "上架"}
              </Button>
              <Button
                aria-label={`删除账号 ${account.serialNumber}`}
                disabled={isMutating}
                size="sm"
                title={`删除账号 ${account.serialNumber}`}
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget(account)}
              >
                {deletingId === account.id ? <Spinner /> : <Trash2 size={15} />}
              </Button>
            </div>
          </div>
        ))}
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
          ) : loading ? (
            <LoadingLine label="加载账号" />
          ) : null}
        </div>
      </div>

      <Card className="hidden overflow-hidden rounded-md shadow-none sm:block">
        <div>
          <div className="h-[calc(100dvh-22rem)] min-h-[420px] max-h-[620px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
                <TableRow>
                  <TableHead>账号</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <AccountTableSkeletonRows />
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
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
                            <div className="truncate font-medium">
                              {account.title}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge className="rounded-sm" variant="secondary">
                                {account.serialNumber}
                              </Badge>
                              {account.images.length} 图
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-price">
                        {formatPrice(account.price)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {account.email || "-"}
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={account.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(account.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/accounts/${account.id}/edit`}
                              scroll={false}
                            >
                              <Edit size={15} />
                              编辑
                            </Link>
                          </Button>
                          <Button
                            disabled={isMutating}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => toggleStatus(account)}
                          >
                            {statusActionId === account.id ? <Spinner /> : null}
                            {account.status === 1 ? "下架" : "上架"}
                          </Button>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && accounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-10 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      暂无账号
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
        {total > 0 ? (
          <AccountsPagination
            loading={loading}
            page={page}
            total={total}
            totalPages={totalPages}
            onPageChange={(nextPage) => loadPage(nextPage, "replace")}
          />
        ) : null}
      </Card>
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

function AccountTableSkeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <div className="flex min-w-72 items-center gap-3">
          <Skeleton className="size-14" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-14" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function AccountsPagination({
  loading,
  onPageChange,
  page,
  total,
  totalPages,
}: {
  loading: boolean;
  onPageChange: (page: number) => void;
  page: number;
  total: number;
  totalPages: number;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const pages = getPaginationPages(page, safeTotalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        第 {page} / {safeTotalPages} 页，共 {total} 个账号
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          aria-label="第一页"
          disabled={loading || isFirstPage}
          size="sm"
          title="第一页"
          type="button"
          variant="outline"
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft size={15} />
        </Button>
        <Button
          aria-label="上一页"
          disabled={loading || isFirstPage}
          size="sm"
          title="上一页"
          type="button"
          variant="outline"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
        >
          <ChevronLeft size={15} />
        </Button>
        {pages.map((pageNumber) => (
          <Button
            aria-current={pageNumber === page ? "page" : undefined}
            disabled={loading || pageNumber === page}
            key={pageNumber}
            size="sm"
            type="button"
            variant={pageNumber === page ? "default" : "outline"}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          aria-label="下一页"
          disabled={loading || isLastPage}
          size="sm"
          title="下一页"
          type="button"
          variant="outline"
          onClick={() => onPageChange(Math.min(page + 1, safeTotalPages))}
        >
          <ChevronRight size={15} />
        </Button>
        <Button
          aria-label="最后一页"
          disabled={loading || isLastPage}
          size="sm"
          title="最后一页"
          type="button"
          variant="outline"
          onClick={() => onPageChange(safeTotalPages)}
        >
          <ChevronsRight size={15} />
        </Button>
      </div>
    </div>
  );
}

function getPaginationPages(page: number, totalPages: number) {
  const pageWindow = 5;
  const halfWindow = Math.floor(pageWindow / 2);
  let start = Math.max(1, page - halfWindow);
  const end = Math.min(totalPages, start + pageWindow - 1);

  start = Math.max(1, end - pageWindow + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
