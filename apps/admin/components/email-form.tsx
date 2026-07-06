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
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createEmail, fetchEmail, updateEmail } from "@/lib/client-api";
import { ADMIN_EMAILS_CHANGED_EVENT } from "@/lib/events";

const postfixOptions = [
  "@163.com",
  "@gmail.com",
  "@outlook.com",
  "@hotmail.com",
  "@yahoo.com",
  "@qq.com",
  "@126.com",
];

type EmailFormPresentation = "page" | "modal";

export function EmailForm({
  emailId,
  presentation = "page",
}: {
  emailId?: number;
  presentation?: EmailFormPresentation;
}) {
  const router = useRouter();
  const isModal = presentation === "modal";
  const [prefix, setPrefix] = useState("");
  const [postfix, setPostfix] = useState("@163.com");
  const [bindStatus, setBindStatus] = useState<1 | 2>(2);
  const [boundAccountId, setBoundAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(emailId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isLinkedToAccount = Boolean(emailId && boundAccountId);

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
        setBoundAccountId(email.boundAccountId ?? null);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "加载失败"),
      )
      .finally(() => setLoading(false));
  }, [emailId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLinkedToAccount) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (emailId) {
        await updateEmail(emailId, { bindStatus, postfix, prefix });
      } else {
        await createEmail({ bindStatus, postfix, prefix });
      }

      window.dispatchEvent(new Event(ADMIN_EMAILS_CHANGED_EVENT));

      if (isModal) {
        router.back();
      } else {
        router.push("/emails");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <EmailFormSkeleton isModal={isModal} />;
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!isModal ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/emails">
                <ArrowLeft size={16} />
                返回邮箱列表
              </Link>
            </Button>
          ) : null}
          <h1
            className={
              isModal ? "text-xl font-bold" : "mt-2 text-2xl font-bold"
            }
          >
            {emailId ? "编辑邮箱" : "新建邮箱"}
          </h1>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={saving || isLinkedToAccount}
          type="submit"
        >
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "保存中..." : "保存邮箱"}
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {isLinkedToAccount ? (
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          已关联账号{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/accounts/${boundAccountId}/edit`}
            scroll={false}
          >
            #{boundAccountId}
          </Link>
          ，邮箱信息不可修改。
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
              disabled={isLinkedToAccount}
              required
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">后缀</span>
            <Select
              disabled={isLinkedToAccount}
              value={postfix}
              onValueChange={setPostfix}
            >
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
              disabled={isLinkedToAccount}
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

function EmailFormSkeleton({ isModal }: { isModal: boolean }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {!isModal ? <Skeleton className="h-8 w-32" /> : null}
          <Skeleton className={isModal ? "h-7 w-28" : "h-8 w-28"} />
        </div>
        <div className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground sm:w-28">
          <Spinner />
          加载邮箱
        </div>
      </div>
      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-16 sm:col-span-2" />
        </CardContent>
      </Card>
    </div>
  );
}
