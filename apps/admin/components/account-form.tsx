"use client";

import type { AdminEmail } from "@wuliuqi/types";
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
import { ArrowLeft, Save, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUploader } from "./image-uploader";
import { RichTextEditor } from "./rich-text-editor";
import { EmailBindStatusBadge } from "./status-badge";
import {
  createAccount,
  fetchAccount,
  fetchEmails,
  updateAccount,
} from "../lib/client-api";

type AccountFormState = {
  serialNumber: string;
  images: string[];
  price: number;
  title: string;
  description: string;
  xianyuUrl: string;
  email: string;
  status: 1 | 2;
};

const emptyForm: AccountFormState = {
  serialNumber: "",
  images: [],
  price: 0,
  title: "",
  description: "",
  xianyuUrl: "",
  email: "",
  status: 1,
};

export function AccountForm({ accountId }: { accountId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [emailKeyword, setEmailKeyword] = useState("");
  const [emailOptions, setEmailOptions] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(Boolean(accountId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accountId) {
      return;
    }

    setLoading(true);
    fetchAccount(accountId)
      .then((account) =>
        setForm({
          serialNumber: account.serialNumber,
          images: account.images,
          price: account.price,
          title: account.title,
          description: account.description,
          xianyuUrl: account.xianyuUrl,
          email: account.email,
          status: account.status === 2 ? 2 : 1,
        }),
      )
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "加载失败"),
      )
      .finally(() => setLoading(false));
  }, [accountId]);

  function updateForm(patch: Partial<AccountFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function searchEmails() {
    const result = await fetchEmails({
      keyword: emailKeyword,
      limit: 20,
      page: 1,
    });
    setEmailOptions(result.list);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        email: form.email.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        xianyuUrl: form.xianyuUrl.trim() || undefined,
      };

      if (accountId) {
        await updateAccount(accountId, payload);
      } else {
        await createAccount(payload);
      }

      router.push("/accounts");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/accounts">
              <ArrowLeft size={16} />
              返回账号列表
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold">
            {accountId ? "编辑账号" : "新建账号"}
          </h1>
        </div>
        <Button disabled={saving} type="submit">
          <Save size={16} />
          {saving ? "保存中..." : "保存账号"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">商品图片</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ImageUploader
                folder="codm-accounts/"
                images={form.images}
                maxCount={10}
                onChange={(images) => updateForm({ images })}
              />
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">账号描述</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RichTextEditor
                value={form.description}
                onChange={(description) => updateForm({ description })}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-md shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">序列号</span>
              <Input
                placeholder="留空自动生成"
                value={form.serialNumber}
                onChange={(event) => updateForm({ serialNumber: event.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">标题</span>
              <Input
                required
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">价格</span>
              <Input
                min={0}
                required
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) =>
                  updateForm({ price: Number(event.target.value) })
                }
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">状态</span>
              <Select
                value={String(form.status)}
                onValueChange={(value) =>
                  updateForm({ status: value === "2" ? 2 : 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">上架</SelectItem>
                  <SelectItem value="2">下架</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">闲鱼链接</span>
              <Input
                placeholder="https://..."
                value={form.xianyuUrl}
                onChange={(event) => updateForm({ xianyuUrl: event.target.value })}
              />
            </label>
            <div className="space-y-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">绑定邮箱</span>
                <Input
                  value={form.email}
                  onChange={(event) => updateForm({ email: event.target.value })}
                />
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索邮箱"
                  value={emailKeyword}
                  onChange={(event) => setEmailKeyword(event.target.value)}
                />
                <Button type="button" variant="outline" onClick={searchEmails}>
                  <Search size={16} />
                </Button>
              </div>
              {emailOptions.length > 0 ? (
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  {emailOptions.map((email) => (
                    <button
                      key={email.id}
                      className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={email.bindStatus === 1}
                      type="button"
                      onClick={() => updateForm({ email: email.email })}
                    >
                      <span className="truncate">{email.email}</span>
                      <EmailBindStatusBadge bindStatus={email.bindStatus} />
                    </button>
                  ))}
                </div>
              ) : (
                <Badge className="rounded-sm font-normal" variant="secondary">
                  可直接输入邮箱，也可搜索后选择未绑定邮箱
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
