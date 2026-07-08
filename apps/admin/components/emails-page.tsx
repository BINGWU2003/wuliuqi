"use client";

import type { AdminEmail, GameKey } from "@wuliuqi/types";
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
import { Button } from "@wuliuqi/ui/components/button";
import { Card } from "@wuliuqi/ui/components/card";
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
  RotateCcw,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CellTooltip,
  TABLE_ACTION_CELL_CLASS,
  TABLE_ACTION_HEAD_CLASS,
} from "@/components/cell-tooltip";
import { EmailBindStatusBadge } from "@/components/status-badge";
import { deleteEmail, fetchEmails } from "@/lib/client-api";
import { ADMIN_EMAILS_CHANGED_EVENT } from "@/lib/events";
import { errorMessage } from "@/lib/feedback";
import { formatDate } from "@/lib/format";

const EMAIL_PAGE_SIZE = 50;
const MOBILE_VIEWPORT_QUERY = "(max-width: 639px)";
const gameOptions: Array<{ label: string; value: GameKey }> = [
  { label: "CODM", value: "codm" },
  { label: "三国杀", value: "sanguosha" },
];

type LoadMode = "append" | "replace";
type EmailPendingAction = { emailId: number; name: "delete" } | null;

function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_VIEWPORT_QUERY).matches
  );
}

export function EmailsPage() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [gameKeyValue, setGameKeyValue] = useState<GameKey>("codm");
  const [gameKey, setGameKey] = useState<GameKey>("codm");
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [bindStatusValue, setBindStatusValue] = useState("all");
  const [bindStatus, setBindStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminEmail | null>(null);
  const [pendingAction, setPendingAction] = useState<EmailPendingAction>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const requestIdRef = useRef(0);
  const totalPagesRef = useRef(0);
  const errorRef = useRef("");

  const fetchEmailPage = useCallback(
    (nextPage: number) =>
      fetchEmails({
        game_key: gameKey,
        bind_status: bindStatus === "all" ? undefined : Number(bindStatus),
        keyword: keyword || undefined,
        limit: EMAIL_PAGE_SIZE,
        page: nextPage,
      }),
    [bindStatus, gameKey, keyword],
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
        const result = await fetchEmailPage(nextPage);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setEmails((current) =>
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
    [applyPagination, fetchEmailPage],
  );

  const loadLoadedPages = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    loadingRef.current = true;
    errorRef.current = "";
    setLoading(true);
    setError("");

    try {
      const firstResult = await fetchEmailPage(1);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextTotalPages = firstResult.pagination.totalPages;
      const targetPage = Math.min(
        Math.max(pageRef.current, 1),
        Math.max(nextTotalPages, 1),
      );
      const nextEmails = [...firstResult.list];
      let latestPagination = {
        ...firstResult.pagination,
        page: targetPage,
      };

      for (let nextPage = 2; nextPage <= targetPage; nextPage += 1) {
        const result = await fetchEmailPage(nextPage);

        if (requestId !== requestIdRef.current) {
          return;
        }

        nextEmails.push(...result.list);
        latestPagination = result.pagination;
      }

      setEmails(nextEmails);
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
  }, [applyPagination, fetchEmailPage]);

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
    function handleEmailsChanged() {
      void reloadCurrentView();
    }

    window.addEventListener(ADMIN_EMAILS_CHANGED_EVENT, handleEmailsChanged);

    return () =>
      window.removeEventListener(
        ADMIN_EMAILS_CHANGED_EVENT,
        handleEmailsChanged,
      );
  }, [reloadCurrentView]);

  function handleSearch() {
    if (loadingRef.current) {
      return;
    }

    const nextKeyword = searchValue.trim();
    const nextGameKey = gameKeyValue;
    const nextBindStatus = bindStatusValue;

    if (
      nextKeyword === keyword &&
      nextGameKey === gameKey &&
      nextBindStatus === bindStatus
    ) {
      void loadPage(1, "replace");
      return;
    }

    setKeyword(nextKeyword);
    setGameKey(nextGameKey);
    setBindStatus(nextBindStatus);
  }

  function handleResetFilters() {
    if (loadingRef.current) {
      return;
    }

    setSearchValue("");
    setGameKeyValue("codm");
    setBindStatusValue("all");

    if (keyword === "" && gameKey === "codm" && bindStatus === "all") {
      void loadPage(1, "replace");
      return;
    }

    setKeyword("");
    setGameKey("codm");
    setBindStatus("all");
  }

  async function confirmRemoveEmail() {
    if (!deleteTarget || pendingAction !== null) {
      return;
    }

    if (isEmailLinked(deleteTarget)) {
      toast.error("该邮箱已关联账号，无法删除");
      setDeleteTarget(null);
      return;
    }

    setPendingAction({ emailId: deleteTarget.id, name: "delete" });
    setError("");

    try {
      await deleteEmail(deleteTarget.id, deleteTarget.gameKey);
      await reloadCurrentView();
      setDeleteTarget(null);
      toast.success("邮箱已删除");
    } catch (deleteError) {
      const message = errorMessage(deleteError, "删除失败");
      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  const isInitialLoading = loading && emails.length === 0;
  const deletingId =
    pendingAction?.name === "delete" ? pendingAction.emailId : null;
  const isMutating = pendingAction !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">邮箱管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 个邮箱，当前显示 {emails.length} 个
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/emails/postfixes">
              <Settings size={16} />
              后缀管理
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/emails/new?game_key=${gameKeyValue}`}>
              <Plus size={16} />
              新建邮箱
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-3 shadow-xs">
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px_160px_auto]">
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
                placeholder="搜索前缀或后缀"
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
          <Select value={bindStatusValue} onValueChange={setBindStatusValue}>
            <SelectTrigger className="h-9 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="1">已绑定</SelectItem>
              <SelectItem value="2">未绑定</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-9 rounded-md bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
              disabled={loading}
              title="搜索邮箱"
              type="button"
              onClick={handleSearch}
            >
              {loading ? <Spinner /> : null}
              {loading ? "搜索中..." : "搜索"}
            </Button>
            <Button
              className="h-9 rounded-md border-border bg-background px-3 text-xs"
              disabled={loading}
              title="重置邮箱筛选"
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
        {isInitialLoading ? <MobileEmailSkeletons /> : null}
        {emails.map((email) => (
          <div
            className="rounded-md border border-border bg-card p-3"
            key={email.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <EmailAddress email={email} />
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="mr-2">更新</span>
                  {formatDate(email.updatedAt)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <EmailBindStatusBadge bindStatus={email.bindStatus} />
                <LinkedAccountBadge email={email} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/emails/${email.id}/edit?game_key=${email.gameKey}`}
                  scroll={false}
                >
                  <Edit size={15} />
                  编辑
                </Link>
              </Button>
              <Button
                aria-label={`删除邮箱 ${email.email}`}
                disabled={isMutating || isEmailLinked(email)}
                size="sm"
                title={
                  isEmailLinked(email)
                    ? "已关联账号，无法删除"
                    : `删除邮箱 ${email.email}`
                }
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget(email)}
              >
                {deletingId === email.id ? <Spinner /> : <Trash2 size={15} />}
              </Button>
            </div>
          </div>
        ))}
        {!loading && emails.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无邮箱
          </div>
        ) : null}
        <div
          ref={loadMoreRef}
          className="flex min-h-12 items-center justify-center py-4"
        >
          {loading && emails.length > 0 ? (
            <LoadingLine label="正在加载更多" />
          ) : emails.length > 0 && page >= totalPages ? (
            <span className="text-sm text-muted-foreground">没有更多了</span>
          ) : emails.length > 0 ? (
            <span className="text-sm text-muted-foreground">下滑加载更多</span>
          ) : null}
        </div>
      </div>

      <Card className="hidden overflow-hidden rounded-md shadow-none sm:block">
        <div>
          <div className="h-[calc(100dvh-22rem)] min-h-[420px] max-h-[620px] overflow-auto">
            <Table className="min-w-[880px]">
              <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
                <TableRow>
                  <TableHead className="min-w-96 whitespace-nowrap">
                    邮箱
                  </TableHead>
                  <TableHead className="min-w-28 whitespace-nowrap">
                    状态
                  </TableHead>
                  <TableHead className="min-w-28 whitespace-nowrap">
                    关联账号
                  </TableHead>
                  <TableHead className="min-w-36 whitespace-nowrap">
                    更新
                  </TableHead>
                  <TableHead className={TABLE_ACTION_HEAD_CLASS}>
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <EmailTableSkeletonRows />
                ) : (
                  emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <EmailAddress email={email} truncate />
                      </TableCell>
                      <TableCell>
                        <EmailBindStatusBadge bindStatus={email.bindStatus} />
                      </TableCell>
                      <TableCell>
                        <LinkedAccountBadge email={email} showEmpty />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <CellTooltip content={formatDate(email.updatedAt)}>
                          {formatDate(email.updatedAt)}
                        </CellTooltip>
                      </TableCell>
                      <TableCell className={TABLE_ACTION_CELL_CLASS}>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/emails/${email.id}/edit?game_key=${email.gameKey}`}
                              scroll={false}
                            >
                              <Edit size={15} />
                              编辑
                            </Link>
                          </Button>
                          <Button
                            aria-label={`删除邮箱 ${email.email}`}
                            disabled={isMutating || isEmailLinked(email)}
                            size="sm"
                            title={
                              isEmailLinked(email)
                                ? "已关联账号，无法删除"
                                : `删除邮箱 ${email.email}`
                            }
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteTarget(email)}
                          >
                            {deletingId === email.id ? (
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
                {!loading && emails.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-10 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      暂无邮箱
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
        {total > 0 ? (
          <EmailsPagination
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
            <AlertDialogTitle>删除邮箱</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除邮箱 {deleteTarget?.email}？删除后无法恢复。
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
                void confirmRemoveEmail();
              }}
            >
              {deletingId !== null ? <Spinner /> : null}
              {deletingId !== null ? "删除中..." : "删除邮箱"}
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

function MobileEmailSkeletons() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="rounded-md border border-border bg-card p-3" key={index}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  ));
}

function EmailTableSkeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-56" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className={TABLE_ACTION_CELL_CLASS}>
        <div className="flex justify-end gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function EmailsPagination({
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
        第 {page} / {safeTotalPages} 页，共 {total} 个邮箱
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

function EmailAddress({
  email,
  truncate = false,
}: {
  email: AdminEmail;
  truncate?: boolean;
}) {
  if (email.boundAccountId) {
    if (truncate) {
      return (
        <CellTooltip className="max-w-96 font-medium" content={email.email}>
          {email.email}
        </CellTooltip>
      );
    }

    return <span className="break-all font-medium">{email.email}</span>;
  }

  if (truncate) {
    return (
      <CellTooltip className="max-w-96 font-medium" content={email.email}>
        {email.email}
      </CellTooltip>
    );
  }

  return <span className="break-all font-medium">{email.email}</span>;
}

function isEmailLinked(email: AdminEmail) {
  return email.boundAccountId !== undefined;
}

function LinkedAccountBadge({
  email,
  showEmpty = false,
}: {
  email: AdminEmail;
  showEmpty?: boolean;
}) {
  if (!email.boundAccountId) {
    return showEmpty ? (
      <span className="text-sm text-muted-foreground">-</span>
    ) : null;
  }

  return (
    <Link
      className="inline-flex h-6 items-center rounded-sm border border-sky-200 bg-sky-50 px-2 text-xs font-medium text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-950"
      href={`/accounts/${email.boundAccountId}/edit?game_key=${email.gameKey}`}
      scroll={false}
      title={`查看账号 #${email.boundAccountId}`}
    >
      账号 #{email.boundAccountId}
    </Link>
  );
}
