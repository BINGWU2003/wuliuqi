"use client";

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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createEmail, fetchEmail, updateEmail } from "../lib/client-api";

const postfixOptions = [
  "@163.com",
  "@gmail.com",
  "@outlook.com",
  "@hotmail.com",
  "@yahoo.com",
  "@qq.com",
  "@126.com",
];

export function EmailForm({ emailId }: { emailId?: number }) {
  const router = useRouter();
  const [prefix, setPrefix] = useState("");
  const [postfix, setPostfix] = useState("@163.com");
  const [bindStatus, setBindStatus] = useState<1 | 2>(2);
  const [loading, setLoading] = useState(Boolean(emailId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!emailId) {
      return;
    }

    setLoading(true);
    fetchEmail(emailId)
      .then((email) => {
        setPrefix(email.prefix);
        setPostfix(email.postfix);
        setBindStatus(email.bindStatus === 1 ? 1 : 2);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "加载失败"),
      )
      .finally(() => setLoading(false));
  }, [emailId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (emailId) {
        await updateEmail(emailId, { bindStatus, postfix, prefix });
      } else {
        await createEmail({ bindStatus, postfix, prefix });
      }

      router.push("/emails");
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
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/emails">
              <ArrowLeft size={16} />
              返回邮箱列表
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold">
            {emailId ? "编辑邮箱" : "新建邮箱"}
          </h1>
        </div>
        <Button className="w-full sm:w-auto" disabled={saving} type="submit">
          <Save size={16} />
          {saving ? "保存中..." : "保存邮箱"}
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">邮箱信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">前缀</span>
            <Input
              required
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">后缀</span>
            <Select value={postfix} onValueChange={setPostfix}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postfixOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">绑定状态</span>
            <Select
              value={String(bindStatus)}
              onValueChange={(value) => setBindStatus(value === "1" ? 1 : 2)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">已绑定</SelectItem>
                <SelectItem value="2">未绑定</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm sm:col-span-2">
            <div className="text-muted-foreground">完整邮箱</div>
            <div className="mt-1 break-all font-medium">
              {prefix || "prefix"}
              {postfix}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
