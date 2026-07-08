"use client";

import type {
  AccountAttributePrimitive,
  AccountAttributes,
  AdminEmail,
  GameAttributeDefinition,
  GameKey,
} from "@wuliuqi/types";
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
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import { ArrowLeft, Save, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { RichTextEditor } from "@/components/rich-text-editor";
import { EmailBindStatusBadge } from "@/components/status-badge";
import {
  createAccount,
  fetchAccount,
  fetchAttributeDefinitions,
  fetchEmails,
  updateAccount,
} from "@/lib/client-api";
import { ADMIN_ACCOUNTS_CHANGED_EVENT } from "@/lib/events";
import { errorMessage } from "@/lib/feedback";

type AccountFormState = {
  serialNumber: string;
  images: string[];
  attributes: AccountAttributes;
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
  attributes: {},
  price: 0,
  title: "",
  description: "",
  xianyuUrl: "",
  email: "",
  status: 1,
};

type AccountFormPresentation = "page" | "modal";
const EMPTY_SELECT_VALUE = "__empty";
const gameOptions: Array<{ label: string; value: GameKey }> = [
  { label: "CODM", value: "codm" },
  { label: "三国杀", value: "sanguosha" },
];

export function AccountForm({
  accountId,
  initialGameKey = "codm",
  lockGame = false,
  onBusyChange,
  presentation = "page",
}: {
  accountId?: number;
  initialGameKey?: GameKey;
  lockGame?: boolean;
  onBusyChange?: (busy: boolean) => void;
  presentation?: AccountFormPresentation;
}) {
  const router = useRouter();
  const isModal = presentation === "modal";
  const [gameKey, setGameKey] = useState<GameKey>(initialGameKey);
  const gameLabel = gameKey === "sanguosha" ? "三国杀" : "CODM";
  const formTitle = `${accountId ? "编辑" : "新建"}${lockGame ? ` ${gameLabel}` : ""}账号`;
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [attributeDefinitions, setAttributeDefinitions] = useState<
    GameAttributeDefinition[]
  >([]);
  const [emailKeyword, setEmailKeyword] = useState("");
  const [emailOptions, setEmailOptions] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(Boolean(accountId));
  const [attributesLoading, setAttributesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingEmails, setSearchingEmails] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const visibleAttributeDefinitions = useMemo(
    () =>
      attributeDefinitions.filter((definition) => {
        if (definition.enabled) {
          return true;
        }

        if (!accountId) {
          return false;
        }

        const value = form.attributes[definition.attrKey];

        return value !== undefined && value !== "";
      }),
    [accountId, attributeDefinitions, form.attributes],
  );

  useEffect(() => {
    onBusyChange?.(saving || imageUploading);

    return () => onBusyChange?.(false);
  }, [imageUploading, onBusyChange, saving]);

  useEffect(() => {
    setAttributesLoading(true);

    fetchAttributeDefinitions(gameKey)
      .then((definitions) => setAttributeDefinitions(definitions))
      .catch((loadError) => {
        toast.error(errorMessage(loadError, "加载属性配置失败"));
      })
      .finally(() => setAttributesLoading(false));
  }, [gameKey]);

  useEffect(() => {
    if (!accountId) {
      return;
    }

    setLoading(true);
    fetchAccount(accountId, gameKey)
      .then((account) =>
        setForm({
          serialNumber: account.serialNumber,
          images: account.images,
          attributes: account.attributes,
          price: account.price,
          title: account.title,
          description: account.description,
          xianyuUrl: account.xianyuUrl,
          email: account.email,
          status: account.status === 2 ? 2 : 1,
        }),
      )
      .then(() => setLoadFailed(false))
      .catch((loadError) => {
        setLoadFailed(true);
        toast.error(errorMessage(loadError, "加载失败"));
      })
      .finally(() => setLoading(false));
  }, [accountId, gameKey]);

  function updateForm(patch: Partial<AccountFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateAttribute(
    key: string,
    value: AccountAttributePrimitive | undefined,
  ) {
    setForm((current) => {
      const attributes = { ...current.attributes };

      if (value === undefined || value === "") {
        delete attributes[key];
      } else {
        attributes[key] = value;
      }

      return { ...current, attributes };
    });
  }

  async function searchEmails() {
    if (searchingEmails) {
      return;
    }

    setSearchingEmails(true);

    try {
      const result = await fetchEmails({
        game_key: gameKey,
        keyword: emailKeyword,
        limit: 20,
        page: 1,
      });
      setEmailOptions(result.list);
    } catch (searchError) {
      toast.error(errorMessage(searchError, "搜索失败"));
    } finally {
      setSearchingEmails(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || imageUploading || loadFailed) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        attributes: form.attributes,
        email: form.email.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        xianyuUrl: form.xianyuUrl.trim() || undefined,
      };

      if (accountId) {
        await updateAccount(accountId, { ...payload, gameKey });
      } else {
        await createAccount({ ...payload, gameKey });
      }

      toast.success(accountId ? "账号已保存" : "账号已创建");
      window.dispatchEvent(new Event(ADMIN_ACCOUNTS_CHANGED_EVENT));

      if (isModal) {
        router.back();
      } else {
        router.push("/accounts");
        router.refresh();
      }
    } catch (submitError) {
      toast.error(errorMessage(submitError, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AccountFormSkeleton isModal={isModal} />;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!isModal ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/accounts">
                <ArrowLeft size={16} />
                返回账号列表
              </Link>
            </Button>
          ) : null}
          <h1
            className={
              isModal ? "text-xl font-bold" : "mt-2 text-2xl font-bold"
            }
          >
            {formTitle}
          </h1>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={saving || imageUploading || loadFailed}
          type="submit"
        >
          {saving ? <Spinner /> : <Save size={16} />}
          {saving ? "保存中..." : "保存账号"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 space-y-4 lg:order-1">
          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">商品图片</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ImageUploader
                folder={`${gameKey}-accounts/`}
                images={form.images}
                maxCount={10}
                onUploadingChange={setImageUploading}
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

        <Card className="order-1 h-fit rounded-md shadow-none lg:order-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">游戏</span>
              <Select
                disabled={Boolean(accountId) || lockGame}
                value={gameKey}
                onValueChange={(value) => {
                  setGameKey(value as GameKey);
                  setForm(emptyForm);
                  setEmailOptions([]);
                }}
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
              <span className="text-sm font-medium">序列号</span>
              <Input
                placeholder="留空自动生成"
                value={form.serialNumber}
                onChange={(event) =>
                  updateForm({ serialNumber: event.target.value })
                }
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
            {attributesLoading ? (
              <div className="space-y-2 border-t border-border pt-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : visibleAttributeDefinitions.length > 0 ? (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="text-sm font-medium">自定义属性</div>
                {visibleAttributeDefinitions.map((definition) => (
                  <AttributeField
                    definition={definition}
                    key={definition.attrKey}
                    value={form.attributes[definition.attrKey]}
                    onChange={(value) =>
                      updateAttribute(definition.attrKey, value)
                    }
                  />
                ))}
              </div>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">闲鱼链接</span>
              <Input
                placeholder="https://..."
                value={form.xianyuUrl}
                onChange={(event) =>
                  updateForm({ xianyuUrl: event.target.value })
                }
              />
            </label>
            <div className="space-y-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">绑定邮箱</span>
                <Input
                  required
                  value={form.email}
                  onChange={(event) =>
                    updateForm({ email: event.target.value })
                  }
                />
              </label>
              <div className="flex gap-2">
                <Input
                  className="min-w-0"
                  placeholder="搜索邮箱"
                  value={emailKeyword}
                  onChange={(event) => setEmailKeyword(event.target.value)}
                />
                <Button
                  disabled={searchingEmails}
                  aria-label="搜索邮箱"
                  title="搜索邮箱"
                  type="button"
                  variant="outline"
                  onClick={searchEmails}
                >
                  {searchingEmails ? <Spinner /> : <Search size={16} />}
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
                      <span className="min-w-0 truncate">{email.email}</span>
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

export function CodmAccountForm({
  accountId,
  onBusyChange,
  presentation,
}: {
  accountId?: number;
  onBusyChange?: (busy: boolean) => void;
  presentation?: AccountFormPresentation;
}) {
  return (
    <AccountForm
      accountId={accountId}
      initialGameKey="codm"
      lockGame
      presentation={presentation}
      onBusyChange={onBusyChange}
    />
  );
}

export function SanguoshaAccountForm({
  accountId,
  onBusyChange,
  presentation,
}: {
  accountId?: number;
  onBusyChange?: (busy: boolean) => void;
  presentation?: AccountFormPresentation;
}) {
  return (
    <AccountForm
      accountId={accountId}
      initialGameKey="sanguosha"
      lockGame
      presentation={presentation}
      onBusyChange={onBusyChange}
    />
  );
}

function AttributeField({
  definition,
  onChange,
  value,
}: {
  definition: GameAttributeDefinition;
  onChange: (value: AccountAttributePrimitive | undefined) => void;
  value: AccountAttributePrimitive | undefined;
}) {
  if (definition.type === "select") {
    const selectValue = typeof value === "string" ? value : EMPTY_SELECT_VALUE;
    const currentValueOption =
      typeof value === "string" &&
      value &&
      !definition.options.some((option) => option.value === value)
        ? { label: `当前值：${value}`, value }
        : null;

    return (
      <label className="block space-y-1.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          {definition.label}
          {!definition.enabled ? (
            <Badge className="rounded-sm" variant="secondary">
              已停用
            </Badge>
          ) : null}
        </span>
        <Select
          value={selectValue}
          onValueChange={(nextValue) =>
            onChange(nextValue === EMPTY_SELECT_VALUE ? undefined : nextValue)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_SELECT_VALUE}>未选择</SelectItem>
            {currentValueOption ? (
              <SelectItem value={currentValueOption.value}>
                {currentValueOption.label}
              </SelectItem>
            ) : null}
            {definition.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }

  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span>
          {definition.label}
          {definition.unit ? `（${definition.unit}）` : ""}
        </span>
        {!definition.enabled ? (
          <Badge className="rounded-sm" variant="secondary">
            已停用
          </Badge>
        ) : null}
      </span>
      <Input
        min={0}
        step={1}
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(event) => {
          const nextValue = event.target.value;

          onChange(nextValue ? Number(nextValue) : undefined);
        }}
      />
    </label>
  );
}

function AccountFormSkeleton({ isModal }: { isModal: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {!isModal ? <Skeleton className="h-8 w-32" /> : null}
          <Skeleton className={isModal ? "h-7 w-28" : "h-8 w-32"} />
        </div>
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 space-y-4 lg:order-1">
          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b border-border">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square" />
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b border-border">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card className="order-1 h-fit rounded-md shadow-none lg:order-2">
          <CardHeader className="border-b border-border">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
