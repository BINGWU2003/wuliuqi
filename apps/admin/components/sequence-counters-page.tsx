"use client";

import type { SequenceCounter } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
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
} from "../lib/client-api";
import { formatDate } from "../lib/format";

export function SequenceCountersPage() {
  const [counters, setCounters] = useState<SequenceCounter[]>([]);
  const [counterName, setCounterName] = useState("CODM_ACCOUNT");
  const [currentValue, setCurrentValue] = useState(0);
  const [resetValues, setResetValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCounters() {
    setLoading(true);
    setMessage("");

    try {
      setCounters(await fetchSequenceCounters());
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCounters();
  }, []);

  async function createCounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      await createSequenceCounter(counterName, currentValue);
      setCounterName("");
      setCurrentValue(0);
      await loadCounters();
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "创建失败");
    }
  }

  async function nextValue(name: string) {
    try {
      const result = await nextSequenceCounterValue(name);
      setMessage(`${result.counterName} 下一个值：${result.nextValue}`);
      await loadCounters();
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "操作失败");
    }
  }

  async function resetValue(name: string) {
    try {
      await resetSequenceCounterValue(name, resetValues[name] ?? 0);
      await loadCounters();
    } catch (resetError) {
      setMessage(resetError instanceof Error ? resetError.message : "重置失败");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">序号计数器</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            用于账号序列号等自增业务编号
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          type="button"
          variant="outline"
          onClick={loadCounters}
        >
          <RefreshCw size={16} />
          刷新
        </Button>
      </div>

      {message ? (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">新建计数器</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" onSubmit={createCounter}>
            <Input
              required
              placeholder="计数器名称"
              value={counterName}
              onChange={(event) => setCounterName(event.target.value)}
            />
            <Input
              min={0}
              type="number"
              value={currentValue}
              onChange={(event) => setCurrentValue(Number(event.target.value))}
            />
            <Button className="w-full sm:w-auto" type="submit">
              <Plus size={16} />
              创建
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
        {counters.map((counter) => (
          <div
            className="rounded-md border border-border bg-card p-3"
            key={counter.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-all font-medium">{counter.counterName}</div>
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
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => resetValue(counter.counterName)}
                >
                  <RotateCcw size={15} />
                  重置
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => nextValue(counter.counterName)}
                >
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
        {loading ? (
          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            加载中...
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
            {counters.map((counter) => (
              <TableRow key={counter.id}>
                <TableCell className="font-medium">{counter.counterName}</TableCell>
                <TableCell className="font-mono">{counter.currentValue}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(counter.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Input
                      className="h-8 w-24"
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
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => resetValue(counter.counterName)}
                    >
                      <RotateCcw size={15} />
                      重置
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => nextValue(counter.counterName)}
                    >
                      下一个
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && counters.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={4}>
                  暂无计数器
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {loading ? (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : null}
      </Card>
    </div>
  );
}
