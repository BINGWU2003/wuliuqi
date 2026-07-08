"use client";

import type { AdminEmailPostfix, GameKey } from "@wuliuqi/types";
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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createEmail,
  fetchEmail,
  fetchEmailPostfixes,
  updateEmail,
} from "@/lib/client-api";
import { ADMIN_EMAILS_CHANGED_EVENT } from "@/lib/events";
import { errorMessage } from "@/lib/feedback";

type EmailFormPresentation = "page" | "modal";
const gameOptions: Array<{ label: string; value: GameKey }> = [
  { label: "CODM", value: "codm" },
  { label: "三国杀", value: "sanguosha" },
];

export function EmailForm({
  emailId,
  initialGameKey = "codm",
  onBusyChange,
  presentation = "page",
}: {
  emailId?: number;
  initialGameKey?: GameKey;
  onBusyChange?: (busy: boolean) => void;
  presentation?: EmailFormPresentation;
}) {
  const router = useRouter();
  const isModal = presentation === "modal";
  const [gameKey, setGameKey] = useState<GameKey>(initialGameKey);
  const [prefix, setPrefix] = useState("");
  const [postfix, setPostfix] = useState("@163.com");
  const [postfixOptions, setPostfixOptions] = useState<AdminEmailPostfix[]>(
    [],
  );
  const [bindStatus, setBindStatus] = useState<1 | 2>(2);
  const [boundAccountId, setBoundAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(emailId));
  const [postfixLoading, setPostfixLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const isLinkedToAccount = Boolean(emailId && boundAccountId);
  const selectablePostfixes = useMemo(
    () =>
      postfixOptions.filter(
        (option) => option.enabled || option.postfix === postfix,
      ),
    [postfix, postfixOptions],
  );
  const hasEnabledPostfix = postfixOptions.some((option) => option.enabled);

  useEffect(() => {
    onBusyChange?.(saving);

    return () => onBusyChange?.(false);
  }, [onBusyChange, saving]);

  useEffect(() => {
    setPostfixLoading(true);

    fetchEmailPostfixes()
      .then((options) => {
        setPostfixOptions(options);

        if (!emailId) {
          const firstEnabled = options.find((option) => option.enabled);

          if (firstEnabled) {
            setPostfix(firstEnabled.postfix);
          }
        }
      })
      .catch((loadError) => {
        setLoadFailed(true);
        toast.error(errorMessage(loadError, "加载邮箱后缀失败"));
      })
      .finally(() => setPostfixLoading(false));
  }, [emailId]);

  useEffect(() => {
    if (!emailId) {
      return;
    }

    setLoading(true);
    fetchEmail(emailId, gameKey)
      .then((email) => {
        setPrefix(email.prefix);
        setPostfix(email.postfix);
        setBindStatus(email.bindStatus === 1 ? 1 : 2);
        setBoundAccountId(email.boundAccountId ?? null);
        setLoadFailed(false);
      })
      .catch((loadError) => {
        setLoadFailed(true);
        toast.error(errorMessage(loadError, "加载失败"));
      })
      .finally(() => setLoading(false));
  }, [emailId, gameKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      saving ||
      postfixLoading ||
      isLinkedToAccount ||
      loadFailed ||
      (!emailId && !hasEnabledPostfix)
    ) {
      return;
    }

    setSaving(true);

    try {
      if (emailId) {
        await updateEmail(emailId, { bindStatus, gameKey, postfix, prefix });
      } else {
        await createEmail({ bindStatus, gameKey, postfix, prefix });
      }

      toast.success(emailId ? "邮箱已保存" : "邮箱已创建");
      window.dispatchEvent(new Event(ADMIN_EMAILS_CHANGED_EVENT));

      if (isModal) {
        router.back();
      } else {
        router.push("/emails");
        router.refresh();
      }
    } catch (submitError) {
      toast.error(errorMessage(submitError, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || postfixLoading) {
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
          disabled={
            saving ||
            isLinkedToAccount ||
            loadFailed ||
            (!emailId && !hasEnabledPostfix)
          }
          type="submit"
        >
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "保存中..." : "保存邮箱"}
        </Button>
      </div>
      {isLinkedToAccount ? (
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          已关联账号{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/accounts/${boundAccountId}/edit?game_key=${gameKey}`}
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
            <span className="text-sm font-medium">游戏</span>
            <Select
              disabled={Boolean(emailId)}
              value={gameKey}
              onValueChange={(value) => setGameKey(value as GameKey)}
            >
              <SelectTrigger>
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
          </label>
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
                {selectablePostfixes.map((option) => (
                  <SelectItem key={option.id} value={option.postfix}>
                    {option.postfix}
                    {option.enabled ? "" : "（已停用）"}
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
            {!hasEnabledPostfix ? (
              <div className="mt-2 text-xs text-destructive">
                当前游戏没有启用的邮箱后缀，请先在邮箱列表中管理后缀。
              </div>
            ) : null}
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
        <Skeleton className="h-9 w-full sm:w-28" />
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
