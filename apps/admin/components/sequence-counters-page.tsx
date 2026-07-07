"use client";

import type { SequenceCounter } from "@wuliuqi/types";
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
import { Plus, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createSequenceCounter,
  fetchSequenceCounters,
  nextSequenceCounterValue,
  resetSequenceCounterValue,
} from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";
import { formatDate } from "@/lib/format";
import { LoadingButton } from "@/components/loading-button";

type CounterConfirmTarget =
  | { type: "next"; counterName: string }
  | { type: "reset"; counterName: string; value: number };
type CounterPendingAction =
  | { name: "create" }
  | { counterName: string; name: "next" | "reset" }
  | null;

export function SequenceCountersPage() {
  const [counters, setCounters] = useState<SequenceCounter[]>([]);
  const [counterName, setCounterName] = useState("CODM_ACCOUNT");
  const [currentValue, setCurrentValue] = useState(0);
  const [resetValues, setResetValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] =
    useState<CounterPendingAction>(null);
  const [confirmTarget, setConfirmTarget] =
    useState<CounterConfirmTarget | null>(null);

  async function loadCounters() {
    setLoading(true);

    try {
      setCounters(await fetchSequenceCounters());
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载失败"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCounters();
  }, []);

  async function createCounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingAction !== null) {
      return;
    }

    setPendingAction({ name: "create" });

    try {
      await createSequenceCounter(counterName, currentValue);
      setCounterName("");
      setCurrentValue(0);
      await loadCounters();
      toast.success("计数器已创建");
    } catch (createError) {
      toast.error(errorMessage(createError, "创建失败"));
    } finally {
      setPendingAction(null);
    }
  }

  async function confirmCounterAction() {
    if (!confirmTarget || pendingAction !== null) {
      return;
    }

    setPendingAction({
      counterName: confirmTarget.counterName,
      name: confirmTarget.type,
    });

    try {
      if (confirmTarget.type === "next") {
        const result = await nextSequenceCounterValue(
          confirmTarget.counterName,
        );
        await loadCounters();
        toast.success(`${result.counterName} 下一个值：${result.nextValue}`);
      } else {
        await resetSequenceCounterValue(
          confirmTarget.counterName,
          confirmTarget.value,
        );
        await loadCounters();
        toast.success("计数器已重置");
      }

      setConfirmTarget(null);
    } catch (actionError) {
      const fallback = confirmTarget.type === "reset" ? "重置失败" : "操作失败";
      toast.error(errorMessage(actionError, fallback));
    } finally {
      setPendingAction(null);
    }
  }

  const isInitialLoading = loading && counters.length === 0;
  const creating = pendingAction?.name === "create";
  const confirmPending =
    pendingAction?.name === "next" || pendingAction?.name === "reset";
  const isMutating = pendingAction !== null;
  const confirmDescription =
    confirmTarget?.type === "reset"
      ? `确认将 ${confirmTarget.counterName} 重置为 ${confirmTarget.value}？这会立即写入服务端。`
      : `确认获取 ${confirmTarget?.counterName ?? ""} 的下一个值？这会立即推进当前计数。`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">序号计数器</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            用于账号序列号等自增业务编号
          </p>
        </div>
        <LoadingButton
          className="w-full sm:w-auto"
          type="button"
          variant="outline"
          loading={loading}
          loadingLabel="刷新中..."
          onClick={loadCounters}
        >
          <RefreshCw size={16} />
          刷新
        </LoadingButton>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">新建计数器</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
            onSubmit={createCounter}
          >
            <Input
              disabled={isMutating}
              required
              placeholder="计数器名称"
              value={counterName}
              onChange={(event) => setCounterName(event.target.value)}
            />
            <Input
              disabled={isMutating}
              min={0}
              type="number"
              value={currentValue}
              onChange={(event) => setCurrentValue(Number(event.target.value))}
            />
            <Button
              className="w-full sm:w-auto"
              disabled={isMutating}
              type="submit"
            >
              {creating ? <Spinner /> : <Plus size={16} />}
              创建
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
        {isInitialLoading ? <MobileCounterSkeletons /> : null}
        {counters.map((counter) => (
          <div
            className="rounded-md border border-border bg-card p-3"
            key={counter.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-all font-medium">
                  {counter.counterName}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="mr-2">更新</span>
                  {formatDate(counter.updatedAt)}
                </div>
              </div>
              <div className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {counter.currentValue}
              </div>
            </div>
            <div className="mt-3 grid gap-2 border-t border-border pt-3">
              <Input
                disabled={isMutating}
                min={0}
                type="number"
                value={resetValues[counter.counterName] ?? 0}
                onChange={(event) =>
                  setResetValues((current) => ({
                    ...current,
                    [counter.counterName]: Number(event.target.value),
                  }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  aria-label={`重置计数器 ${counter.counterName}`}
                  disabled={isMutating}
                  size="sm"
                  title={`重置计数器 ${counter.counterName}`}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setConfirmTarget({
                      counterName: counter.counterName,
                      type: "reset",
                      value: resetValues[counter.counterName] ?? 0,
                    })
                  }
                >
                  {isPendingCounterAction(
                    pendingAction,
                    "reset",
                    counter.counterName,
                  ) ? (
                    <Spinner />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                  重置
                </Button>
                <Button
                  aria-label={`获取 ${counter.counterName} 的下一个值`}
                  disabled={isMutating}
                  size="sm"
                  title={`获取 ${counter.counterName} 的下一个值`}
                  type="button"
                  onClick={() =>
                    setConfirmTarget({
                      counterName: counter.counterName,
                      type: "next",
                    })
                  }
                >
                  {isPendingCounterAction(
                    pendingAction,
                    "next",
                    counter.counterName,
                  ) ? (
                    <Spinner />
                  ) : null}
                  下一个
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!loading && counters.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无计数器
          </div>
        ) : null}
        {loading && counters.length > 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <LoadingLine label="正在刷新" />
          </div>
        ) : null}
      </div>

      <Card className="hidden rounded-md shadow-none sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>当前值</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInitialLoading ? <CounterTableSkeletonRows /> : null}
            {counters.map((counter) => (
              <TableRow key={counter.id}>
                <TableCell className="font-medium">
                  {counter.counterName}
                </TableCell>
                <TableCell className="font-mono">
                  {counter.currentValue}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(counter.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Input
                      className="h-8 w-24"
                      disabled={isMutating}
                      min={0}
                      type="number"
                      value={resetValues[counter.counterName] ?? 0}
                      onChange={(event) =>
                        setResetValues((current) => ({
                          ...current,
                          [counter.counterName]: Number(event.target.value),
                        }))
                      }
                    />
                    <Button
                      aria-label={`重置计数器 ${counter.counterName}`}
                      disabled={isMutating}
                      size="sm"
                      title={`重置计数器 ${counter.counterName}`}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setConfirmTarget({
                          counterName: counter.counterName,
                          type: "reset",
                          value: resetValues[counter.counterName] ?? 0,
                        })
                      }
                    >
                      {isPendingCounterAction(
                        pendingAction,
                        "reset",
                        counter.counterName,
                      ) ? (
                        <Spinner />
                      ) : (
                        <RotateCcw size={15} />
                      )}
                      重置
                    </Button>
                    <Button
                      aria-label={`获取 ${counter.counterName} 的下一个值`}
                      disabled={isMutating}
                      size="sm"
                      title={`获取 ${counter.counterName} 的下一个值`}
                      type="button"
                      onClick={() =>
                        setConfirmTarget({
                          counterName: counter.counterName,
                          type: "next",
                        })
                      }
                    >
                      {isPendingCounterAction(
                        pendingAction,
                        "next",
                        counter.counterName,
                      ) ? (
                        <Spinner />
                      ) : null}
                      下一个
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && counters.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-10 text-center text-muted-foreground"
                  colSpan={4}
                >
                  暂无计数器
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {loading && counters.length > 0 ? (
          <div className="border-t border-border px-4 py-3">
            <LoadingLine label="正在刷新" />
          </div>
        ) : null}
      </Card>
      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open && !confirmPending) {
            setConfirmTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.type === "reset" ? "重置计数器" : "获取下一个值"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmCounterAction();
              }}
            >
              {confirmPending ? <Spinner /> : null}
              {confirmPending
                ? confirmTarget?.type === "reset"
                  ? "重置中..."
                  : "获取中..."
                : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function isPendingCounterAction(
  pendingAction: CounterPendingAction,
  name: "next" | "reset",
  counterName: string,
) {
  return (
    pendingAction?.name === name && pendingAction.counterName === counterName
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

function MobileCounterSkeletons() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div className="rounded-md border border-border bg-card p-3" key={index}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="mt-3 grid gap-2 border-t border-border pt-3">
        <Skeleton className="h-9" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </div>
  ));
}

function CounterTableSkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </TableCell>
    </TableRow>
  ));
}
