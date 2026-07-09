export type RechargeMode = "normal" | "double";

export type RechargePlanKind = "normal" | "leastOverflow" | "doublePriority";

export interface CpPackage {
  id: string;
  label: string;
  gainedCp: number;
  costCp: number;
  type: "normal" | "double";
  baseCp?: number;
  bonusCp?: number;
}

export interface RechargeTarget {
  id: string;
  label: string;
  cp: number;
}

export interface RechargeTargetItem {
  id: string;
  label: string;
  cp: number;
  quantity: number;
  totalCp: number;
}

export interface PackageUse {
  pack: CpPackage;
  count: number;
}

export interface RechargePlan {
  id: string;
  kind: RechargePlanKind;
  title: string;
  description: string;
  uses: PackageUse[];
  gainedCp: number;
  costCp: number;
  currentCp: number;
  targetCp: number;
  targetLabel: string;
  targetItems: RechargeTargetItem[];
  needCp: number;
  finalCp: number;
  overflowCp: number;
  excludedDoubleLabels: string[];
}

type NormalCombination = {
  counts: Map<string, number>;
  gainedCp: number;
  costCp: number;
  count: number;
};

type DoubleSubset = {
  packs: CpPackage[];
  gainedCp: number;
  costCp: number;
  count: number;
};

const maxCalculatedCp = 200000;

export const CODM_NORMAL_PACKAGES: CpPackage[] = [
  { id: "normal-80", label: "80 CP", gainedCp: 80, costCp: 80, type: "normal" },
  {
    id: "normal-420",
    label: "420 CP",
    gainedCp: 420,
    costCp: 420,
    type: "normal",
  },
  {
    id: "normal-880",
    label: "880 CP",
    gainedCp: 880,
    costCp: 880,
    type: "normal",
  },
  {
    id: "normal-2400",
    label: "2400 CP",
    gainedCp: 2400,
    costCp: 2400,
    type: "normal",
  },
  {
    id: "normal-5000",
    label: "5000 CP",
    gainedCp: 5000,
    costCp: 5000,
    type: "normal",
  },
  {
    id: "normal-10800",
    label: "10800 CP",
    gainedCp: 10800,
    costCp: 10800,
    type: "normal",
  },
];

export const CODM_DOUBLE_PACKAGES: CpPackage[] = [
  {
    id: "double-80",
    label: "80 + 80",
    gainedCp: 160,
    costCp: 80,
    type: "double",
    baseCp: 80,
    bonusCp: 80,
  },
  {
    id: "double-400",
    label: "400 + 400",
    gainedCp: 800,
    costCp: 400,
    type: "double",
    baseCp: 400,
    bonusCp: 400,
  },
  {
    id: "double-800",
    label: "800 + 800",
    gainedCp: 1600,
    costCp: 800,
    type: "double",
    baseCp: 800,
    bonusCp: 800,
  },
  {
    id: "double-2000",
    label: "2000 + 2000",
    gainedCp: 4000,
    costCp: 2000,
    type: "double",
    baseCp: 2000,
    bonusCp: 2000,
  },
  {
    id: "double-4000",
    label: "4000 + 4000",
    gainedCp: 8000,
    costCp: 4000,
    type: "double",
    baseCp: 4000,
    bonusCp: 4000,
  },
  {
    id: "double-8000",
    label: "8000 + 8000",
    gainedCp: 16000,
    costCp: 8000,
    type: "double",
    baseCp: 8000,
    bonusCp: 8000,
  },
];

export const CODM_RECHARGE_TARGETS: RechargeTarget[] = [
  { id: "legend-melee", label: "单副近战武器传说", cp: 4550 },
  { id: "mythic-gun-guarantee", label: "神话枪皮保底", cp: 5810 },
  { id: "legend-character-guarantee", label: "传说角色转盘保底", cp: 5810 },
  { id: "mythic-character", label: "神话角色转盘", cp: 7220 },
  { id: "legend-draw", label: "传说转盘", cp: 4950 },
  { id: "mythic-gun-upgrade", label: "神话枪皮只升满级", cp: 6300 },
  { id: "mythic-character-upgrade", label: "神话角色只升满级", cp: 12000 },
];

export function calculateRechargePlans({
  availableDoublePackageIds,
  currentCp,
  mode,
  targetItems,
}: {
  availableDoublePackageIds: string[];
  currentCp: number;
  mode: RechargeMode;
  targetItems: RechargeTargetItem[];
}) {
  const normalizedCurrentCp = normalizeCp(currentCp);
  const normalizedTargetItems = normalizeTargetItems(targetItems);
  const targetCp = normalizedTargetItems.reduce(
    (total, item) => total + item.totalCp,
    0,
  );
  const targetLabel = formatTargetLabel(normalizedTargetItems);
  const normalizedTargetCp = normalizeCp(targetCp);
  const needCp = Math.max(normalizedTargetCp - normalizedCurrentCp, 0);
  const excludedDoubleLabels = CODM_DOUBLE_PACKAGES.filter(
    (pack) => !availableDoublePackageIds.includes(pack.id),
  ).map((pack) => pack.label);

  if (needCp <= 0) {
    return {
      needCp,
      plans: [],
      satisfied: true,
    };
  }

  if (mode === "normal") {
    return {
      needCp,
      plans: [
        buildPlan({
          currentCp: normalizedCurrentCp,
          doubleSubset: emptyDoubleSubset(),
          excludedDoubleLabels: [],
          kind: "normal",
          normal: solveNormalCombination(needCp),
          targetCp: normalizedTargetCp,
          targetItems: normalizedTargetItems,
          targetLabel,
        }),
      ],
      satisfied: false,
    };
  }

  const availableDoublePackages = CODM_DOUBLE_PACKAGES.filter((pack) =>
    availableDoublePackageIds.includes(pack.id),
  );
  const subsets = getDoubleSubsets(availableDoublePackages);

  const leastOverflowPlan = chooseDoublePlan({
    currentCp: normalizedCurrentCp,
    excludedDoubleLabels,
    kind: "leastOverflow",
    subsets,
    targetCp: normalizedTargetCp,
    targetItems: normalizedTargetItems,
    targetLabel,
  });
  const doublePriorityPlan = chooseDoublePlan({
    currentCp: normalizedCurrentCp,
    excludedDoubleLabels,
    kind: "doublePriority",
    subsets,
    targetCp: normalizedTargetCp,
    targetItems: normalizedTargetItems,
    targetLabel,
  });

  return {
    needCp,
    plans:
      leastOverflowPlan.id === doublePriorityPlan.id
        ? [leastOverflowPlan]
        : [leastOverflowPlan, doublePriorityPlan],
    satisfied: false,
  };
}

export function formatPackageUses(uses: PackageUse[], type: "normal" | "double") {
  const filteredUses = uses.filter((use) => use.pack.type === type);

  if (filteredUses.length === 0) {
    return "无";
  }

  return filteredUses
    .map((use) => `${use.pack.label} × ${use.count}`)
    .join("，");
}

export function buildRechargePlanText(plan: RechargePlan) {
  const lines = [
    "CODM 充值方案",
    `当前已有：${plan.currentCp} CP`,
    "目标项目：",
    ...formatTargetItemLines(plan.targetItems),
    `目标合计：${plan.targetCp} CP`,
    `还差：${plan.needCp} CP`,
    "",
  ];

  if (plan.kind !== "normal") {
    lines.push("活动状态：首充双倍");
    if (plan.excludedDoubleLabels.length > 0) {
      lines.push(`已排除双倍档位：${plan.excludedDoubleLabels.join("，")}`);
    }
    lines.push("");
  }

  lines.push("推荐充值：");
  const doubleUses = formatPackageUses(plan.uses, "double");
  if (plan.kind !== "normal" || doubleUses !== "无") {
    lines.push(`双倍套餐：${doubleUses}`);
  }
  lines.push(`普通套餐：${formatPackageUses(plan.uses, "normal")}`);
  lines.push(`共获得：${plan.gainedCp} CP`);
  lines.push(`充值后：${plan.finalCp} CP`);
  lines.push(`预计剩余：${plan.overflowCp} CP`);

  return lines.join("\n");
}

function chooseDoublePlan({
  currentCp,
  excludedDoubleLabels,
  kind,
  subsets,
  targetCp,
  targetItems,
  targetLabel,
}: {
  currentCp: number;
  excludedDoubleLabels: string[];
  kind: "leastOverflow" | "doublePriority";
  subsets: DoubleSubset[];
  targetCp: number;
  targetItems: RechargeTargetItem[];
  targetLabel: string;
}) {
  const needCp = Math.max(targetCp - currentCp, 0);
  let best: RechargePlan | null = null;

  for (const subset of subsets) {
    const normal = solveNormalCombination(Math.max(needCp - subset.gainedCp, 0));
    const candidate = buildPlan({
      currentCp,
      doubleSubset: subset,
      excludedDoubleLabels,
      kind,
      normal,
      targetCp,
      targetItems,
      targetLabel,
    });

    if (!best || comparePlans(candidate, best, kind) < 0) {
      best = candidate;
    }
  }

  return best ?? buildPlan({
    currentCp,
    doubleSubset: emptyDoubleSubset(),
    excludedDoubleLabels,
    kind,
    normal: solveNormalCombination(needCp),
    targetCp,
    targetItems,
    targetLabel,
  });
}

function buildPlan({
  currentCp,
  doubleSubset,
  excludedDoubleLabels,
  kind,
  normal,
  targetCp,
  targetItems,
  targetLabel,
}: {
  currentCp: number;
  doubleSubset: DoubleSubset;
  excludedDoubleLabels: string[];
  kind: RechargePlanKind;
  normal: NormalCombination;
  targetCp: number;
  targetItems: RechargeTargetItem[];
  targetLabel: string;
}): RechargePlan {
  const uses = mergeUses(doubleSubset.packs, normal.counts);
  const gainedCp = doubleSubset.gainedCp + normal.gainedCp;
  const costCp = doubleSubset.costCp + normal.costCp;
  const needCp = Math.max(targetCp - currentCp, 0);
  const finalCp = currentCp + gainedCp;
  const overflowCp = Math.max(finalCp - targetCp, 0);

  return {
    id: [
      kind,
      ...uses.map((use) => `${use.pack.id}:${use.count}`),
      currentCp,
      targetCp,
    ].join("|"),
    kind,
    title: getPlanTitle(kind),
    description: getPlanDescription(kind),
    uses,
    gainedCp,
    costCp,
    currentCp,
    targetCp,
    targetLabel,
    targetItems,
    needCp,
    finalCp,
    overflowCp,
    excludedDoubleLabels,
  };
}

function solveNormalCombination(requiredCp: number): NormalCombination {
  if (requiredCp <= 0) {
    return emptyNormalCombination();
  }

  const maxPackageCp = Math.max(
    ...CODM_NORMAL_PACKAGES.map((pack) => pack.gainedCp),
  );
  const maxCp = requiredCp + maxPackageCp;
  const dp: Array<NormalCombination | null> = Array.from(
    { length: maxCp + 1 },
    () => null,
  );
  dp[0] = emptyNormalCombination();

  for (let cp = 0; cp <= maxCp; cp += 1) {
    const current = dp[cp];

    if (!current) {
      continue;
    }

    for (const pack of CODM_NORMAL_PACKAGES) {
      const nextCp = cp + pack.gainedCp;

      if (nextCp > maxCp) {
        continue;
      }

      const candidate = addNormalPackage(current, pack);
      const existing = dp[nextCp];

      if (!existing || compareNormalCombinations(candidate, existing) < 0) {
        dp[nextCp] = candidate;
      }
    }
  }

  let best: NormalCombination | null = null;
  for (let cp = requiredCp; cp <= maxCp; cp += 1) {
    const candidate = dp[cp];

    if (!candidate) {
      continue;
    }

    if (!best || compareNormalCandidates(candidate, best, requiredCp) < 0) {
      best = candidate;
    }
  }

  return best ?? emptyNormalCombination();
}

function comparePlans(
  left: RechargePlan,
  right: RechargePlan,
  kind: "leastOverflow" | "doublePriority",
) {
  if (kind === "doublePriority") {
    return compareBy(
      [left.costCp, left.overflowCp, left.uses.length, -countDoubleUses(left)],
      [right.costCp, right.overflowCp, right.uses.length, -countDoubleUses(right)],
    );
  }

  return compareBy(
    [left.overflowCp, left.costCp, left.uses.length, -countDoubleUses(left)],
    [right.overflowCp, right.costCp, right.uses.length, -countDoubleUses(right)],
  );
}

function compareNormalCandidates(
  left: NormalCombination,
  right: NormalCombination,
  requiredCp: number,
) {
  return compareBy(
    [left.gainedCp - requiredCp, left.count, normalPackagePreference(left)],
    [right.gainedCp - requiredCp, right.count, normalPackagePreference(right)],
  );
}

function compareNormalCombinations(
  left: NormalCombination,
  right: NormalCombination,
) {
  return compareBy(
    [left.count, normalPackagePreference(left)],
    [right.count, normalPackagePreference(right)],
  );
}

function normalPackagePreference(combination: NormalCombination) {
  return [...CODM_NORMAL_PACKAGES].reverse().reduce((score, pack, index) => {
    return score + (combination.counts.get(pack.id) ?? 0) * 10 ** index;
  }, 0);
}

function compareBy(left: number[], right: number[]) {
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

function getDoubleSubsets(packages: CpPackage[]) {
  const subsets: DoubleSubset[] = [emptyDoubleSubset()];

  for (const pack of packages) {
    const currentLength = subsets.length;
    for (let index = 0; index < currentLength; index += 1) {
      const current = subsets[index];
      if (!current) {
        continue;
      }

      subsets.push({
        packs: [...current.packs, pack],
        gainedCp: current.gainedCp + pack.gainedCp,
        costCp: current.costCp + pack.costCp,
        count: current.count + 1,
      });
    }
  }

  return subsets;
}

function mergeUses(
  doublePacks: CpPackage[],
  normalCounts: Map<string, number>,
): PackageUse[] {
  const doubleUses = [...doublePacks]
    .sort((left, right) => right.gainedCp - left.gainedCp)
    .map((pack) => ({ pack, count: 1 }));
  const normalUses = [...CODM_NORMAL_PACKAGES]
    .reverse()
    .map((pack) => ({ pack, count: normalCounts.get(pack.id) ?? 0 }))
    .filter((use) => use.count > 0);

  return [...doubleUses, ...normalUses];
}

function addNormalPackage(combination: NormalCombination, pack: CpPackage) {
  const counts = new Map(combination.counts);
  counts.set(pack.id, (counts.get(pack.id) ?? 0) + 1);

  return {
    counts,
    gainedCp: combination.gainedCp + pack.gainedCp,
    costCp: combination.costCp + pack.costCp,
    count: combination.count + 1,
  };
}

function emptyNormalCombination(): NormalCombination {
  return {
    counts: new Map(),
    gainedCp: 0,
    costCp: 0,
    count: 0,
  };
}

function emptyDoubleSubset(): DoubleSubset {
  return {
    packs: [],
    gainedCp: 0,
    costCp: 0,
    count: 0,
  };
}

function getPlanTitle(kind: RechargePlanKind) {
  if (kind === "leastOverflow") {
    return "溢出最少方案";
  }

  if (kind === "doublePriority") {
    return "活动优先方案";
  }

  return "推荐方案";
}

function getPlanDescription(kind: RechargePlanKind) {
  if (kind === "leastOverflow") {
    return "优先让充值后剩余 CP 尽量少。";
  }

  if (kind === "doublePriority") {
    return "优先利用双倍收益，按获得同等 CP 的充值档位更少来计算。";
  }

  return "在普通套餐中优先选择剩余 CP 最少的组合。";
}

function normalizeTargetItems(items: RechargeTargetItem[]) {
  return items
    .map((item) => {
      const cp = normalizeCp(item.cp);
      const quantity = Math.min(99, Math.max(0, Math.floor(item.quantity)));

      return {
        id: item.id,
        label: item.label,
        cp,
        quantity,
        totalCp: normalizeCp(cp * quantity),
      };
    })
    .filter((item) => item.cp > 0 && item.quantity > 0 && item.totalCp > 0);
}

function formatTargetLabel(items: RechargeTargetItem[]) {
  if (items.length === 0) {
    return "CODM 目标";
  }

  if (items.length === 1) {
    const item = items[0];
    if (!item) {
      return "CODM 目标";
    }

    return item.quantity > 1 ? `${item.label} × ${item.quantity}` : item.label;
  }

  return `${items.length} 个目标合计`;
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

function countDoubleUses(plan: RechargePlan) {
  return plan.uses
    .filter((use) => use.pack.type === "double")
    .reduce((total, use) => total + use.count, 0);
}

function normalizeCp(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(maxCalculatedCp, Math.max(0, Math.floor(value)));
}
