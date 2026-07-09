"use client";

import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { Input } from "@wuliuqi/ui/components/input";
import { toast } from "@wuliuqi/ui/components/sonner";
import { cn } from "@wuliuqi/ui/lib/utils";
import {
  Calculator,
  Check,
  Copy,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ContactOptionsButton } from "@/components/contact-options-button";
import {
  CODM_DOUBLE_PACKAGES,
  CODM_NORMAL_PACKAGES,
  CODM_RECHARGE_TARGETS,
  buildRechargePlanText,
  calculateRechargePlans,
  formatPackageUses,
  type RechargeMode,
  type RechargePlan,
  type RechargeTarget,
  type RechargeTargetItem,
} from "@/lib/recharge";

const doubleStorageKey = "wuliuqi-shop-codm-available-double-packages";
const maxInputCp = 200000;
const maxTargetQuantity = 99;

export function CodmRechargeCalculator() {
  const [currentCpText, setCurrentCpText] = useState("800");
  const [customTargetText, setCustomTargetText] = useState("");
  const [customQuantityText, setCustomQuantityText] = useState("0");
  const [targetQuantities, setTargetQuantities] = useState<Record<string, number>>(
    {
      "mythic-gun-guarantee": 1,
    },
  );
  const [mode, setMode] = useState<RechargeMode>("normal");
  const [availableDoubleIds, setAvailableDoubleIds] = useState<string[]>(
    CODM_DOUBLE_PACKAGES.map((pack) => pack.id),
  );

  useEffect(() => {
    const storedValue = window.localStorage.getItem(doubleStorageKey);

    if (!storedValue) {
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue);
      if (Array.isArray(parsedValue)) {
        const knownIds = CODM_DOUBLE_PACKAGES.map((pack) => pack.id);
        setAvailableDoubleIds(
          parsedValue.filter((id): id is string => knownIds.includes(id)),
        );
      }
    } catch {
      window.localStorage.removeItem(doubleStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      doubleStorageKey,
      JSON.stringify(availableDoubleIds),
    );
  }, [availableDoubleIds]);

  const currentCp = parseCp(currentCpText);
  const customTargetCp = parseCp(customTargetText);
  const customQuantity = parseQuantity(customQuantityText);
  const targetItems = useMemo(() => {
    const commonItems = CODM_RECHARGE_TARGETS.map((target) => {
      const quantity = targetQuantities[target.id] ?? 0;

      return createTargetItem(target, quantity);
    }).filter((item) => item.quantity > 0);

    if (customTargetCp > 0 && customQuantity > 0) {
      commonItems.push({
        id: "custom",
        label: "自定义目标",
        cp: customTargetCp,
        quantity: customQuantity,
        totalCp: Math.min(maxInputCp, customTargetCp * customQuantity),
      });
    }

    return commonItems;
  }, [customQuantity, customTargetCp, targetQuantities]);
  const targetCp = Math.min(
    maxInputCp,
    targetItems.reduce((total, item) => total + item.totalCp, 0),
  );
  const totalTargetQuantity = targetItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const hasValidTarget = targetItems.length > 0 && targetCp > 0;

  const result = useMemo(() => {
    if (!hasValidTarget) {
      return null;
    }

    return calculateRechargePlans({
      availableDoublePackageIds: availableDoubleIds,
      currentCp,
      mode,
      targetItems,
    });
  }, [availableDoubleIds, currentCp, hasValidTarget, mode, targetItems]);

  function updateTargetQuantity(id: string, nextQuantity: number) {
    setTargetQuantities((current) => ({
      ...current,
      [id]: clampQuantity(nextQuantity),
    }));
  }

  function toggleDoublePackage(id: string) {
    setAvailableDoubleIds((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id],
    );
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("方案已复制，可以直接发给卖家");
    } catch {
      toast.error("复制失败，可以手动截图或选择文字复制");
    }
  }

  async function copySatisfiedResult() {
    await copyText(
      [
        "CODM 充值方案",
        `当前已有：${currentCp} CP`,
        "目标项目：",
        ...formatTargetItemLines(targetItems),
        `目标合计：${targetCp} CP`,
        "当前 CP 已满足目标，暂不需要充值。",
      ].join("\n"),
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal">
            CODM 充值专区
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            输入当前 CP 和多个目标数量，自动计算普通套餐与双倍活动下的充值方案。
          </p>
        </div>
        <ContactOptionsButton className="sm:w-auto" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Card className="rounded-md shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator size={18} />
              充值参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="current-cp">
                当前已有 CP
              </label>
              <Input
                className="h-11 rounded-md text-base"
                id="current-cp"
                inputMode="numeric"
                min={0}
                type="number"
                value={currentCpText}
                onChange={(event) => setCurrentCpText(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold">目标清单</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  按需要调整数量，例如神话枪皮 × 2、传说转盘 × 3。
                </p>
              </div>
              <div className="space-y-2">
                {CODM_RECHARGE_TARGETS.map((target) => (
                  <TargetQuantityRow
                    key={target.id}
                    quantity={targetQuantities[target.id] ?? 0}
                    target={target}
                    onChange={(quantity) =>
                      updateTargetQuantity(target.id, quantity)
                    }
                  />
                ))}
              </div>
              <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_132px]">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="custom-target"
                    >
                      自定义目标 CP
                    </label>
                    <Input
                      className="h-10 rounded-md"
                      id="custom-target"
                      inputMode="numeric"
                      min={0}
                      placeholder="例如 3000"
                      type="number"
                      value={customTargetText}
                      onChange={(event) =>
                        setCustomTargetText(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="custom-quantity"
                    >
                      数量
                    </label>
                    <QuantityStepper
                      ariaLabel="自定义目标数量"
                      id="custom-quantity"
                      quantity={customQuantity}
                      onChange={(quantity) =>
                        setCustomQuantityText(String(quantity))
                      }
                    />
                  </div>
                </div>
                <div className="text-xs leading-5 text-muted-foreground">
                  自定义目标用于临时活动或多个小目标合并计算。
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">充值模式</div>
              <div className="grid grid-cols-2 gap-2">
                <ModeButton
                  active={mode === "normal"}
                  description="只使用常规 CP 套餐"
                  icon={<PackageCheck size={18} />}
                  title="普通充值"
                  onClick={() => setMode("normal")}
                />
                <ModeButton
                  active={mode === "double"}
                  description="可选首充双倍档位"
                  icon={<Gift size={18} />}
                  title="有双倍活动"
                  onClick={() => setMode("double")}
                />
              </div>
            </div>

            {mode === "double" ? (
              <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                <div>
                  <div className="text-sm font-semibold">可用双倍档位</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    已经充值过的首充双倍请取消勾选，计算时每个双倍档位最多使用一次。
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CODM_DOUBLE_PACKAGES.map((pack) => {
                    const checked = availableDoubleIds.includes(pack.id);

                    return (
                      <button
                        key={pack.id}
                        className={cn(
                          "flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm font-semibold transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground",
                        )}
                        type="button"
                        onClick={() => toggleDoublePackage(pack.id)}
                      >
                        {checked ? <Check size={15} /> : null}
                        {pack.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                普通套餐
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CODM_NORMAL_PACKAGES.map((pack) => (
                  <Badge key={pack.id} className="rounded-sm" variant="secondary">
                    {pack.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <SummaryCard
            currentCp={currentCp}
            needCp={result?.needCp ?? 0}
            targetCp={targetCp}
            targetItems={targetItems}
            totalTargetQuantity={totalTargetQuantity}
            valid={hasValidTarget}
          />

          {!hasValidTarget ? (
            <Card className="rounded-md shadow-none">
              <CardContent className="p-5 text-sm text-muted-foreground">
                请至少选择一个目标数量，或填写自定义目标 CP 和数量。
              </CardContent>
            </Card>
          ) : result?.satisfied ? (
            <Card className="rounded-md border-emerald-200 bg-emerald-50/70 shadow-none dark:border-emerald-900/70 dark:bg-emerald-950/30">
              <CardContent className="space-y-4 p-5">
                <div>
                  <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                    当前 CP 已满足目标
                  </div>
                  <p className="mt-1 text-sm leading-6 text-emerald-800/80 dark:text-emerald-100/80">
                    现在已有 {currentCp} CP，目标需要 {targetCp} CP，暂不需要继续充值。
                  </p>
                </div>
                <Button className="h-10 rounded-md" type="button" onClick={copySatisfiedResult}>
                  <Copy size={16} />
                  复制结果
                </Button>
              </CardContent>
            </Card>
          ) : (
            result?.plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onCopy={copyText} />
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function ModeButton({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={cn(
        "rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-accent",
      )}
      type="button"
      onClick={onClick}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </span>
      <span
        className={cn(
          "mt-1 block text-xs leading-5",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {description}
      </span>
    </button>
  );
}

function TargetQuantityRow({
  onChange,
  quantity,
  target,
}: {
  onChange: (quantity: number) => void;
  quantity: number;
  target: RechargeTarget;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-[1fr_132px]",
        quantity > 0 && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{target.label}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {target.cp} CP / 个
          {quantity > 0 ? `，小计 ${target.cp * quantity} CP` : ""}
        </div>
      </div>
      <QuantityStepper
        ariaLabel={`${target.label} 数量`}
        quantity={quantity}
        onChange={onChange}
      />
    </div>
  );
}

function QuantityStepper({
  ariaLabel,
  id,
  onChange,
  quantity,
}: {
  ariaLabel: string;
  id?: string;
  onChange: (quantity: number) => void;
  quantity: number;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr_36px] items-center rounded-md border border-input bg-background">
      <button
        aria-label={`${ariaLabel}减少`}
        className="grid h-9 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        disabled={quantity <= 0}
        title="减少"
        type="button"
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={16} />
      </button>
      <input
        aria-label={ariaLabel}
        className="h-9 min-w-0 border-x border-input bg-transparent text-center text-sm font-semibold outline-none"
        id={id}
        inputMode="numeric"
        max={maxTargetQuantity}
        min={0}
        type="number"
        value={quantity}
        onChange={(event) => onChange(parseQuantity(event.target.value))}
      />
      <button
        aria-label={`${ariaLabel}增加`}
        className="grid h-9 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        disabled={quantity >= maxTargetQuantity}
        title="增加"
        type="button"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function SummaryCard({
  currentCp,
  needCp,
  targetCp,
  targetItems,
  totalTargetQuantity,
  valid,
}: {
  currentCp: number;
  needCp: number;
  targetCp: number;
  targetItems: RechargeTargetItem[];
  totalTargetQuantity: number;
  valid: boolean;
}) {
  return (
    <Card className="rounded-md shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="当前已有" value={`${currentCp} CP`} />
          <Metric
            label="已选目标"
            value={valid ? `${targetItems.length} 项 / ${totalTargetQuantity} 个` : "-"}
          />
          <Metric label="目标合计" value={valid ? `${targetCp} CP` : "-"} />
          <Metric label="还差" value={valid ? `${needCp} CP` : "-"} />
        </div>
        {valid ? (
          <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3">
            {targetItems.map((item) => (
              <div
                className="flex items-center justify-between gap-3 text-sm"
                key={item.id}
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.label} × {item.quantity}
                </span>
                <span className="shrink-0 font-semibold">{item.totalCp} CP</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PlanCard({
  onCopy,
  plan,
}: {
  onCopy: (text: string) => Promise<void>;
  plan: RechargePlan;
}) {
  const doubleUses = formatPackageUses(plan.uses, "double");

  return (
    <Card className="rounded-md shadow-none">
      <CardHeader className="space-y-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles size={18} />
              {plan.title}
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {plan.description}
            </p>
          </div>
          <Button
            className="h-9 shrink-0 rounded-md"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onCopy(buildRechargePlanText(plan))}
          >
            <Copy size={15} />
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="共获得" value={`${plan.gainedCp} CP`} />
          <Metric label="充值后" value={`${plan.finalCp} CP`} />
          <Metric label="预计剩余" value={`${plan.overflowCp} CP`} />
        </div>

        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
          {doubleUses !== "无" || plan.kind !== "normal" ? (
            <PlanLine label="双倍套餐" value={doubleUses} />
          ) : null}
          <PlanLine
            label="普通套餐"
            value={formatPackageUses(plan.uses, "normal")}
          />
        </div>

        {plan.excludedDoubleLabels.length > 0 ? (
          <div className="text-xs leading-5 text-muted-foreground">
            已排除双倍档位：{plan.excludedDoubleLabels.join("，")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[80px_1fr]">
      <div className="font-semibold text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function parseCp(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.min(maxInputCp, Math.max(0, parsedValue));
}

function parseQuantity(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return clampQuantity(parsedValue);
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(maxTargetQuantity, Math.max(0, Math.floor(value)));
}

function createTargetItem(
  target: RechargeTarget,
  quantity: number,
): RechargeTargetItem {
  const safeQuantity = clampQuantity(quantity);

  return {
    id: target.id,
    label: target.label,
    cp: target.cp,
    quantity: safeQuantity,
    totalCp: Math.min(maxInputCp, target.cp * safeQuantity),
  };
}

function formatTargetItemLines(items: RechargeTargetItem[]) {
  if (items.length === 0) {
    return ["未选择目标"];
  }

  return items.map((item) => {
    if (item.quantity === 1) {
      return `${item.label}：${item.cp} CP`;
    }

    return `${item.label}：${item.cp} CP × ${item.quantity} = ${item.totalCp} CP`;
  });
}
