"use client";

import type { AdminAccount } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wuliuqi/ui/components/table";
import { Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountStatusBadge } from "./status-badge";
import {
  deleteAccount,
  fetchAccounts,
  updateAccountStatus,
} from "../lib/client-api";
import { formatDate, formatPrice } from "../lib/format";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  async function loadAccounts() {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAccounts({
        keyword,
        limit: 50,
        page: 1,
        sort,
        status: status === "all" ? undefined : Number(status),
      });
      setAccounts(result.list);
      setTotal(result.pagination.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort]);

  async function toggleStatus(account: AdminAccount) {
    await updateAccountStatus(account.id, account.status === 1 ? 2 : 1);
    await loadAccounts();
  }

  async function removeAccount(account: AdminAccount) {
    if (!window.confirm(`确认删除账号 ${account.serialNumber}？`)) {
      return;
    }

    await deleteAccount(account.id);
    await loadAccounts();
  }

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
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadAccounts();
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
          <Button variant="outline" onClick={() => loadAccounts()}>
            <RefreshCw size={16} />
            刷新
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
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
                <Link href={`/accounts/${account.id}/edit`}>
                  <Edit size={15} />
                  编辑
                </Link>
              </Button>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => toggleStatus(account)}
              >
                {account.status === 1 ? "下架" : "上架"}
              </Button>
              <Button
                aria-label={`删除账号 ${account.serialNumber}`}
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => removeAccount(account)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
        {!loading && accounts.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无账号
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            加载中...
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
              <TableHead>账号</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
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
                      <div className="truncate font-medium">{account.title}</div>
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
                      <Link href={`/accounts/${account.id}/edit`}>
                        <Edit size={15} />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => toggleStatus(account)}
                    >
                      {account.status === 1 ? "下架" : "上架"}
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => removeAccount(account)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && accounts.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  暂无账号
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
        {error ? (
          <div className="border-t border-border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
