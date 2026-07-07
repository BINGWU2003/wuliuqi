"use client";

import type {
  GameAttributeDefinition,
  GameAttributeOption,
  GameAttributeType,
} from "@wuliuqi/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wuliuqi/ui/components/dialog";
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
import { preventOutsideDismiss } from "@wuliuqi/ui/lib/modal-interactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@wuliuqi/ui/components/table";
import { Edit, Eraser, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CellTooltip,
  TABLE_ACTION_CELL_CLASS,
  TABLE_ACTION_HEAD_CLASS,
} from "@/components/cell-tooltip";
import { LoadingButton } from "@/components/loading-button";
import {
  clearAttributeDefinitionValues,
  createAttributeDefinition,
  deleteAttributeDefinition,
  fetchAttributeDefinitions,
  updateAttributeDefinition,
} from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

type AttributeFormState = {
  id?: number;
  attrKey: string;
  label: string;
  type: GameAttributeType;
  unit: string;
  enabled: "true" | "false";
  sortOrder: number;
  options: GameAttributeOption[];
};

type AttributeConfirmTarget = {
  type: "clear" | "delete";
  definition: GameAttributeDefinition;
};

type AttributeDefinitionFormProps = {
  form: AttributeFormState;
  identityLocked: boolean;
  saving: boolean;
  showCancel: boolean;
  addOption: () => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  removeOption: (index: number) => void;
  updateForm: (patch: Partial<AttributeFormState>) => void;
  updateOption: (index: number, patch: Partial<GameAttributeOption>) => void;
};

const emptyForm: AttributeFormState = {
  attrKey: "",
  label: "",
  type: "number",
  unit: "个",
  enabled: "true",
  sortOrder: 0,
  options: [],
};

export function AttributeDefinitionsPage() {
  const [definitions, setDefinitions] = useState<GameAttributeDefinition[]>([]);
  const [form, setForm] = useState<AttributeFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<AttributeConfirmTarget | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const sortedDefinitions = useMemo(
    () =>
      [...definitions].sort(
        (first, second) =>
          first.sortOrder - second.sortOrder || first.id - second.id,
      ),
    [definitions],
  );
  const editingDefinition = useMemo(
    () =>
      form.id === undefined
        ? undefined
        : definitions.find((definition) => definition.id === form.id),
    [definitions, form.id],
  );
  const identityLocked = (editingDefinition?.usageCount ?? 0) > 0;

  useEffect(() => {
    void loadDefinitions();
  }, []);

  async function loadDefinitions() {
    setLoading(true);

    try {
      setDefinitions(await fetchAttributeDefinitions("codm"));
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载属性配置失败"));
    } finally {
      setLoading(false);
    }
  }

  function updateForm(patch: Partial<AttributeFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function editDefinition(definition: GameAttributeDefinition) {
    setForm({
      id: definition.id,
      attrKey: definition.attrKey,
      label: definition.label,
      type: definition.type,
      unit: definition.unit ?? "",
      enabled: definition.enabled ? "true" : "false",
      sortOrder: definition.sortOrder,
      options: definition.options.length > 0 ? definition.options : [],
    });
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    resetForm();
  }

  function handleFormOpenChange(open: boolean) {
    if (open) {
      setFormOpen(true);
      return;
    }

    closeForm();
  }

  function updateOption(index: number, patch: Partial<GameAttributeOption>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }));
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: [...current.options, { label: "", value: "" }],
    }));
  }

  function removeOption(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    const options =
      form.type === "select"
        ? form.options
            .map((option) => ({
              label: option.label.trim(),
              value: option.value.trim(),
            }))
            .filter((option) => option.label && option.value)
        : [];
    const payload = {
      gameKey: "codm",
      attrKey: form.attrKey.trim(),
      label: form.label.trim(),
      type: form.type,
      unit: form.type === "number" ? form.unit.trim() || undefined : undefined,
      options,
      enabled: form.enabled === "true",
      sortOrder: form.sortOrder,
    };

    try {
      if (form.id) {
        await updateAttributeDefinition(form.id, payload);
      } else {
        await createAttributeDefinition(payload);
      }

      toast.success(form.id ? "属性配置已保存" : "属性配置已创建");
      resetForm();
      setFormOpen(false);
      await loadDefinitions();
    } catch (submitError) {
      toast.error(errorMessage(submitError, "保存属性配置失败"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmAttributeAction() {
    if (!confirmTarget || confirmPending) {
      return;
    }

    setConfirmPending(true);

    try {
      if (confirmTarget.type === "clear") {
        const result = await clearAttributeDefinitionValues(
          confirmTarget.definition.id,
        );

        toast.success(`已清空 ${result.clearedCount} 个账号的属性值`);
      } else {
        await deleteAttributeDefinition(confirmTarget.definition.id);

        if (form.id === confirmTarget.definition.id) {
          resetForm();
          setFormOpen(false);
        }

        toast.success("属性配置已删除");
      }

      setConfirmTarget(null);
      await loadDefinitions();
    } catch (actionError) {
      toast.error(
        errorMessage(
          actionError,
          confirmTarget.type === "clear"
            ? "清空属性值失败"
            : "删除属性配置失败",
        ),
      );
    } finally {
      setConfirmPending(false);
    }
  }

  const confirmUsageCount = confirmTarget?.definition.usageCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">属性配置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {definitions.length} 个 CODM 属性
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            className="w-full sm:w-auto"
            disabled={loading}
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={16} />
            新建属性
          </Button>
          <LoadingButton
            className="w-full sm:w-auto"
            loading={loading}
            loadingLabel="刷新中..."
            type="button"
            variant="outline"
            onClick={() => void loadDefinitions()}
          >
            <RefreshCw size={16} />
            刷新
          </LoadingButton>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {loading ? <MobileAttributeSkeletonCards /> : null}
        {!loading && sortedDefinitions.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            暂无属性配置
          </div>
        ) : null}
        {!loading
          ? sortedDefinitions.map((definition) => (
              <MobileAttributeCard
                confirmPending={confirmPending}
                definition={definition}
                key={definition.id}
                onClear={() => setConfirmTarget({ type: "clear", definition })}
                onDelete={() =>
                  setConfirmTarget({ type: "delete", definition })
                }
                onEdit={() => editDefinition(definition)}
              />
            ))
          : null}
      </div>

      <div className="hidden lg:block">
        <Card className="overflow-hidden rounded-md shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">CODM 属性</CardTitle>
          </CardHeader>
          <div className="overflow-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56 whitespace-nowrap">
                    属性
                  </TableHead>
                  <TableHead className="min-w-24 whitespace-nowrap">
                    类型
                  </TableHead>
                  <TableHead className="min-w-72 whitespace-nowrap">
                    选项/单位
                  </TableHead>
                  <TableHead className="min-w-24 whitespace-nowrap">
                    状态
                  </TableHead>
                  <TableHead className="min-w-24 whitespace-nowrap">
                    使用账号
                  </TableHead>
                  <TableHead className="min-w-20 whitespace-nowrap">
                    排序
                  </TableHead>
                  <TableHead className={TABLE_ACTION_HEAD_CLASS}>
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <AttributeSkeletonRows /> : null}
                {!loading && sortedDefinitions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-10 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      暂无属性配置
                    </TableCell>
                  </TableRow>
                ) : null}
                {!loading
                  ? sortedDefinitions.map((definition) => {
                      const optionSummary =
                        getAttributeDefinitionOptionSummary(definition);
                      const usageCount = definition.usageCount ?? 0;

                      return (
                        <TableRow key={definition.id}>
                          <TableCell className="max-w-56">
                            <CellTooltip
                              className="font-medium"
                              content={definition.label}
                            >
                              {definition.label}
                            </CellTooltip>
                            <div className="mt-1 text-xs text-muted-foreground">
                              <CellTooltip content={definition.attrKey}>
                                {definition.attrKey}
                              </CellTooltip>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <CellTooltip
                              content={
                                definition.type === "number" ? "数字" : "下拉"
                              }
                            >
                              {definition.type === "number" ? "数字" : "下拉"}
                            </CellTooltip>
                          </TableCell>
                          <TableCell className="max-w-72">
                            {definition.type === "number" ? (
                              <CellTooltip content={optionSummary}>
                                {optionSummary}
                              </CellTooltip>
                            ) : (
                              <CellTooltip asChild content={optionSummary}>
                                <div className="flex max-w-72 flex-nowrap gap-1 overflow-hidden">
                                  {definition.options.length > 0 ? (
                                    definition.options.map((option) => (
                                      <Badge
                                        className="shrink-0 rounded-sm font-normal"
                                        key={option.value}
                                        variant="secondary"
                                      >
                                        {option.label}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </div>
                              </CellTooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="rounded-sm"
                              variant={
                                definition.enabled ? "default" : "secondary"
                              }
                            >
                              {definition.enabled ? "启用" : "停用"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <CellTooltip content={`${usageCount} 个账号`}>
                              {usageCount}
                            </CellTooltip>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <CellTooltip content={definition.sortOrder}>
                              {definition.sortOrder}
                            </CellTooltip>
                          </TableCell>
                          <TableCell className={TABLE_ACTION_CELL_CLASS}>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                type="button"
                                variant="ghost"
                                onClick={() => editDefinition(definition)}
                              >
                                <Edit size={15} />
                                编辑
                              </Button>
                              {usageCount > 0 ? (
                              <Button
                                disabled={confirmPending}
                                size="sm"
                                title={`清空 ${usageCount} 个账号中的该属性值`}
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  setConfirmTarget({
                                    type: "clear",
                                    definition,
                                  })
                                }
                              >
                                <Eraser size={15} />
                                清空值
                              </Button>
                              ) : null}
                              <Button
                                disabled={usageCount > 0 || confirmPending}
                                size="sm"
                                title={
                                  usageCount > 0
                                    ? `已有 ${usageCount} 个账号使用该属性，不能删除`
                                    : "删除属性配置"
                                }
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  setConfirmTarget({
                                    type: "delete",
                                    definition,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                                删除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : null}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent
          className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:rounded-md sm:border"
          onFocusOutside={preventOutsideDismiss}
          onInteractOutside={preventOutsideDismiss}
          onPointerDownOutside={preventOutsideDismiss}
        >
          <DialogTitle className="sr-only">
            {form.id ? "编辑属性" : "新建属性"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            配置 CODM 属性名称、类型、选项、状态和排序。
          </DialogDescription>
          <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background/95 px-3 backdrop-blur">
            <Button
              aria-label="关闭属性编辑"
              className="size-9 rounded-md"
              disabled={saving}
              size="icon"
              title={saving ? "保存中，暂不能关闭" : "关闭属性编辑"}
              type="button"
              variant="ghost"
              onClick={closeForm}
            >
              <X size={18} />
            </Button>
          </div>
          <div className="h-[calc(100%-3rem)] overflow-y-auto p-3 sm:p-5">
            <div className="mx-auto max-w-2xl space-y-4">
              <div>
                <h1 className="text-xl font-bold">
                  {form.id ? "编辑属性" : "新建属性"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  配置 CODM 属性名称、类型、选项、状态和排序。
                </p>
              </div>
              <Card className="rounded-md shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">属性信息</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <AttributeDefinitionForm
                    addOption={addOption}
                    form={form}
                    identityLocked={identityLocked}
                    saving={saving}
                    showCancel
                    updateForm={updateForm}
                    updateOption={updateOption}
                    onCancel={closeForm}
                    onSubmit={handleSubmit}
                    removeOption={removeOption}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open && !confirmPending) {
            setConfirmTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.type === "clear" ? "清空属性值" : "删除属性配置"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.type === "clear"
                ? `确认从 ${confirmUsageCount} 个账号中清空「${confirmTarget.definition.label}」？这会移除账号 attributes 中的 ${confirmTarget.definition.attrKey}。`
                : `确认删除「${confirmTarget?.definition.label ?? ""}」？删除后该属性不会再出现在配置、账号表单或详情中。`}
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
                void confirmAttributeAction();
              }}
            >
              {confirmPending ? <Spinner /> : null}
              {confirmPending
                ? confirmTarget?.type === "clear"
                  ? "清空中..."
                  : "删除中..."
                : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MobileAttributeCard({
  confirmPending,
  definition,
  onClear,
  onDelete,
  onEdit,
}: {
  confirmPending: boolean;
  definition: GameAttributeDefinition;
  onClear: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const optionSummary = getAttributeDefinitionOptionSummary(definition);
  const usageCount = definition.usageCount ?? 0;

  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{definition.label}</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">
              {definition.attrKey}
            </div>
          </div>
          <Badge
            className="shrink-0 rounded-sm"
            variant={definition.enabled ? "default" : "secondary"}
          >
            {definition.enabled ? "启用" : "停用"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <AttributeSummaryItem
            label="类型"
            value={definition.type === "number" ? "数字" : "下拉"}
          />
          <AttributeSummaryItem label="使用" value={`${usageCount} 个`} />
          <AttributeSummaryItem label="排序" value={definition.sortOrder} />
        </div>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground">
            {definition.type === "number" ? "单位" : "选项"}
          </div>
          <div className="mt-1 line-clamp-2 text-sm">{optionSummary}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <Button size="sm" type="button" variant="outline" onClick={onEdit}>
            <Edit size={15} />
            编辑
          </Button>
          <Button
            disabled={usageCount === 0 || confirmPending}
            size="sm"
            title={
              usageCount > 0
                ? `清空 ${usageCount} 个账号中的该属性值`
                : "暂无账号使用该属性"
            }
            type="button"
            variant="outline"
            onClick={onClear}
          >
            <Eraser size={15} />
            清空
          </Button>
          <Button
            disabled={usageCount > 0 || confirmPending}
            size="sm"
            title={
              usageCount > 0
                ? `已有 ${usageCount} 个账号使用该属性，不能删除`
                : "删除属性配置"
            }
            type="button"
            variant="ghost"
            onClick={onDelete}
          >
            <Trash2 size={15} />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AttributeSummaryItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function MobileAttributeSkeletonCards() {
  return Array.from({ length: 3 }).map((_, index) => (
    <Card className="rounded-md shadow-none" key={index}>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-14" />
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </CardContent>
    </Card>
  ));
}

function AttributeDefinitionForm({
  addOption,
  form,
  identityLocked,
  onCancel,
  onSubmit,
  removeOption,
  saving,
  showCancel,
  updateForm,
  updateOption,
}: AttributeDefinitionFormProps) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">属性标识</span>
        <Input
          disabled={identityLocked}
          required
          title={
            identityLocked ? "该属性已被账号使用，不能修改属性标识" : undefined
          }
          value={form.attrKey}
          onChange={(event) => updateForm({ attrKey: event.target.value })}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">属性名称</span>
        <Input
          required
          value={form.label}
          onChange={(event) => updateForm({ label: event.target.value })}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">类型</span>
        <Select
          disabled={identityLocked}
          value={form.type}
          onValueChange={(value) =>
            updateForm({
              type: value === "select" ? "select" : "number",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">数字</SelectItem>
            <SelectItem value="select">下拉</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {form.type === "number" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">单位</span>
          <Input
            value={form.unit}
            onChange={(event) => updateForm({ unit: event.target.value })}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">下拉选项</span>
            <Button size="sm" type="button" variant="outline" onClick={addOption}>
              <Plus size={15} />
              添加
            </Button>
          </div>
          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}>
                <Input
                  placeholder="名称"
                  value={option.label}
                  onChange={(event) =>
                    updateOption(index, { label: event.target.value })
                  }
                />
                <Input
                  placeholder="值"
                  value={option.value}
                  onChange={(event) =>
                    updateOption(index, { value: event.target.value })
                  }
                />
                <Button
                  aria-label="移除选项"
                  size="icon"
                  title="移除选项"
                  type="button"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                >
                  <X size={15} />
                </Button>
              </div>
            ))}
            {form.options.length === 0 ? (
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={addOption}
              >
                <Plus size={15} />
                添加选项
              </Button>
            ) : null}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">状态</span>
          <Select
            value={form.enabled}
            onValueChange={(value) =>
              updateForm({
                enabled: value === "false" ? "false" : "true",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">启用</SelectItem>
              <SelectItem value="false">停用</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">排序</span>
          <Input
            min={0}
            type="number"
            value={form.sortOrder}
            onChange={(event) =>
              updateForm({ sortOrder: Number(event.target.value) })
            }
          />
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" disabled={saving} type="submit">
          {saving ? <Spinner /> : <Save size={16} />}
          保存
        </Button>
        {showCancel ? (
          <Button
            disabled={saving}
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function AttributeSkeletonRows() {
  return Array.from({ length: 3 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-10" />
      </TableCell>
      <TableCell className={TABLE_ACTION_CELL_CLASS}>
        <div className="flex justify-end gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function getAttributeDefinitionOptionSummary(
  definition: GameAttributeDefinition,
) {
  if (definition.type === "number") {
    return definition.unit || "-";
  }

  return definition.options.map((option) => option.label).join("、") || "-";
}
