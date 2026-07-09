"use client";

import type { AdminEmailPostfix } from "@wuliuqi/types";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createEmailPostfix,
  deleteEmailPostfix,
  fetchEmailPostfixes,
  updateEmailPostfix,
} from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

type PendingAction =
  | { id: number; name: "delete" | "toggle" }
  | { id: "create"; name: "create" }
  | null;

export function EmailPostfixesPage() {
  const [postfixes, setPostfixes] = useState<AdminEmailPostfix[]>([]);
  const [postfixValue, setPostfixValue] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminEmailPostfix | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const loadPostfixes = useCallback(async () => {
    setLoading(true);

    try {
      setPostfixes(await fetchEmailPostfixes());
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载邮箱后缀失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPostfixes();
  }, [loadPostfixes]);

  async function createPostfix(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pendingAction || !postfixValue.trim()) {
      return;
    }

    setPendingAction({ id: "create", name: "create" });

    try {
      await createEmailPostfix({
        enabled: true,
        postfix: postfixValue,
        sortOrder,
      });
      setPostfixValue("");
      setSortOrder(0);
      await loadPostfixes();
      toast.success("邮箱后缀已创建");
    } catch (createError) {
      toast.error(errorMessage(createError, "创建邮箱后缀失败"));
    } finally {
      setPendingAction(null);
    }
  }

  async function togglePostfix(postfix: AdminEmailPostfix) {
    if (pendingAction) {
      return;
    }

    setPendingAction({ id: postfix.id, name: "toggle" });

    try {
      await updateEmailPostfix(postfix.id, { enabled: !postfix.enabled });
      await loadPostfixes();
      toast.success(postfix.enabled ? "邮箱后缀已停用" : "邮箱后缀已启用");
    } catch (toggleError) {
      toast.error(errorMessage(toggleError, "更新邮箱后缀失败"));
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmDeletePostfix() {
    if (!deleteTarget || pendingAction) {
      return;
    }

    setPendingAction({ id: deleteTarget.id, name: "delete" });

    try {
      await deleteEmailPostfix(deleteTarget.id);
      setDeleteTarget(null);
      await loadPostfixes();
      toast.success("邮箱后缀已删除");
    } catch (deleteError) {
      toast.error(errorMessage(deleteError, "删除邮箱后缀失败"));
    } finally {
      setPendingAction(null);
    }
  }

  const createPending = pendingAction?.id === "create";
  const deletePending =
    pendingAction?.name === "delete" ? pendingAction.id : null;
  const togglePending =
    pendingAction?.name === "toggle" ? pendingAction.id : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/emails">
              <ArrowLeft size={16} />
              返回邮箱列表
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold tracking-normal">
            邮箱后缀管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            所有游戏共用 {postfixes.length} 个后缀
          </p>
        </div>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">新增后缀</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form
            className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_140px_auto]"
            onSubmit={createPostfix}
          >
            <Input
              required
              placeholder="@163.com"
              value={postfixValue}
              onChange={(event) => setPostfixValue(event.target.value)}
            />
            <Input
              min={0}
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
            <Button disabled={createPending} type="submit">
              {createPending ? <Spinner /> : <Plus size={16} />}
              新增
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
        {loading ? <EmailPostfixMobileSkeletons /> : null}
        {!loading
          ? postfixes.map((postfix) => (
              <div
                className="rounded-md border border-border bg-card p-3"
                key={postfix.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-all font-medium">
                      {postfix.postfix}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        className="rounded-sm"
                        variant={postfix.enabled ? "default" : "secondary"}
                      >
                        {postfix.enabled ? "启用" : "停用"}
                      </Badge>
                      <span>使用中 {postfix.usageCount}</span>
                      <span>排序 {postfix.sortOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3">
                  <Button
                    disabled={Boolean(pendingAction)}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => togglePostfix(postfix)}
                  >
                    {togglePending === postfix.id ? <Spinner /> : null}
                    {postfix.enabled ? "停用" : "启用"}
                  </Button>
                  <Button
                    aria-label={`删除邮箱后缀 ${postfix.postfix}`}
                    disabled={Boolean(pendingAction) || postfix.usageCount > 0}
                    size="sm"
                    title={
                      postfix.usageCount > 0
                        ? "已被邮箱使用，只能停用"
                        : `删除邮箱后缀 ${postfix.postfix}`
                    }
                    type="button"
                    variant="ghost"
                    onClick={() => setDeleteTarget(postfix)}
                  >
                    {deletePending === postfix.id ? (
                      <Spinner />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </Button>
                </div>
              </div>
            ))
          : null}
        {!loading && postfixes.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无邮箱后缀
          </div>
        ) : null}
      </div>

      <Card className="hidden overflow-hidden rounded-md shadow-none sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>后缀</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>使用中邮箱</TableHead>
              <TableHead>排序</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <EmailPostfixSkeletonRows /> : null}
            {!loading
              ? postfixes.map((postfix) => (
                  <TableRow key={postfix.id}>
                    <TableCell className="font-medium">
                      {postfix.postfix}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="rounded-sm"
                        variant={postfix.enabled ? "default" : "secondary"}
                      >
                        {postfix.enabled ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>{postfix.usageCount}</TableCell>
                    <TableCell>{postfix.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          disabled={Boolean(pendingAction)}
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => togglePostfix(postfix)}
                        >
                          {togglePending === postfix.id ? <Spinner /> : null}
                          {postfix.enabled ? "停用" : "启用"}
                        </Button>
                        <Button
                          aria-label={`删除邮箱后缀 ${postfix.postfix}`}
                          disabled={
                            Boolean(pendingAction) || postfix.usageCount > 0
                          }
                          size="sm"
                          title={
                            postfix.usageCount > 0
                              ? "已被邮箱使用，只能停用"
                              : `删除邮箱后缀 ${postfix.postfix}`
                          }
                          type="button"
                          variant="ghost"
                          onClick={() => setDeleteTarget(postfix)}
                        >
                          {deletePending === postfix.id ? (
                            <Spinner />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && postfixes.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-10 text-center text-muted-foreground"
                  colSpan={5}
                >
                  暂无邮箱后缀
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletePending === null) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除邮箱后缀</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除 {deleteTarget?.postfix}？删除后不会再作为邮箱候选后缀。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending !== null}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              disabled={deletePending !== null}
              onClick={(event) => {
                event.preventDefault();
                void confirmDeletePostfix();
              }}
            >
              {deletePending !== null ? <Spinner /> : null}
              {deletePending !== null ? "删除中..." : "删除后缀"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmailPostfixSkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function EmailPostfixMobileSkeletons() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="rounded-md border border-border bg-card p-3" key={index}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  ));
}
