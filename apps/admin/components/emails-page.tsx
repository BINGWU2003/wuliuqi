"use client";

import type { AdminEmail } from "@wuliuqi/types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wuliuqi/ui/components/table";
import { Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmailBindStatusBadge } from "@/components/status-badge";
import { deleteEmail, fetchEmails } from "@/lib/client-api";
import { formatDate } from "@/lib/format";

export function EmailsPage() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [keyword, setKeyword] = useState("");
  const [bindStatus, setBindStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminEmail | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadEmails() {
    setLoading(true);
    setError("");

    try {
      const result = await fetchEmails({
        bind_status: bindStatus === "all" ? undefined : Number(bindStatus),
        keyword,
        limit: 80,
        page: 1,
      });
      setEmails(result.list);
      setTotal(result.pagination.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindStatus]);

  async function confirmRemoveEmail() {
    if (!deleteTarget || deletingId !== null) {
      return;
    }

    setDeletingId(deleteTarget.id);
    setError("");

    try {
      await deleteEmail(deleteTarget.id);
      await loadEmails();
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  }

  const isInitialLoading = loading && emails.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">邮箱管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 个邮箱，当前显示 {emails.length} 个
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/emails/new">
            <Plus size={16} />
            新建邮箱
          </Link>
        </Button>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-[minmax(220px,1fr)_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="搜索前缀或后缀"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadEmails();
                }
              }}
            />
          </div>
          <Select value={bindStatus} onValueChange={setBindStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="1">已绑定</SelectItem>
              <SelectItem value="2">未绑定</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => loadEmails()}
          >
            {loading ? <Spinner /> : <RefreshCw size={16} />}
            刷新
          </Button>
        </CardContent>
      </Card>

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
              <EmailBindStatusBadge bindStatus={email.bindStatus} />
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/emails/${email.id}/edit`}>
                  <Edit size={15} />
                  编辑
                </Link>
              </Button>
              <Button
                aria-label={`删除邮箱 ${email.email}`}
                disabled={deletingId === email.id}
                size="sm"
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
        {loading ? (
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <LoadingLine label={emails.length > 0 ? "正在刷新" : "加载邮箱"} />
          </div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <Card className="hidden rounded-md shadow-none sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInitialLoading ? <EmailTableSkeletonRows /> : null}
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <EmailAddress email={email} />
                </TableCell>
                <TableCell>
                  <EmailBindStatusBadge bindStatus={email.bindStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(email.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/emails/${email.id}/edit`}>
                        <Edit size={15} />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      disabled={deletingId === email.id}
                      size="sm"
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
            ))}
            {!loading && emails.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-10 text-center text-muted-foreground"
                  colSpan={4}
                >
                  暂无邮箱
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {loading ? (
          <div className="border-t border-border px-4 py-3">
            <LoadingLine label={emails.length > 0 ? "正在刷新" : "加载邮箱"} />
          </div>
        ) : null}
        {error ? (
          <div className="border-t border-border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
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
              删除邮箱
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
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function EmailAddress({ email }: { email: AdminEmail }) {
  if (email.bindStatus === 1 && email.boundAccountId) {
    return (
      <Link
        className="break-all font-medium text-primary underline-offset-4 hover:underline"
        href={`/accounts/${email.boundAccountId}/edit`}
        scroll={false}
      >
        {email.email}
      </Link>
    );
  }

  return <span className="break-all font-medium">{email.email}</span>;
}
