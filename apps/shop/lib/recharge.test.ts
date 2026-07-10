import { describe, expect, it } from "vitest";
import {
  CODM_DOUBLE_PACKAGES,
  CODM_NORMAL_PACKAGES,
  buildRechargePlanText,
  calculateRechargePlans,
  formatPackageUses,
  type RechargeTargetItem,
} from "./recharge";

function targetItem(
  patch: Pick<RechargeTargetItem, "id" | "label" | "cp" | "quantity">,
): RechargeTargetItem {
  return {
    ...patch,
    totalCp: patch.cp * patch.quantity,
  };
}

describe("CODM 充值方案计算", () => {
  it("普通和双倍套餐价格一一对应", () => {
    expect(
      CODM_NORMAL_PACKAGES.map((pack) => [pack.gainedCp, pack.priceRmb]),
    ).toEqual([
      [80, 7],
      [420, 32],
      [880, 62],
      [2400, 160],
      [5000, 310],
      [10800, 580],
    ]);
    expect(
      CODM_DOUBLE_PACKAGES.map((pack) => [pack.label, pack.priceRmb]),
    ).toEqual([
      ["80 + 80", 7],
      ["400 + 400", 32],
      ["800 + 800", 62],
      ["2000 + 2000", 160],
      ["4000 + 4000", 310],
      ["8000 + 8000", 580],
    ]);
  });

  it("按金额优先推荐普通套餐并显示预计金额", () => {
    const result = calculateRechargePlans({
      availableDoublePackageIds: [],
      currentCp: 800,
      mode: "normal",
      targetItems: [
        targetItem({
          cp: 5810,
          id: "mythic-gun-guarantee",
          label: "神话枪皮保底",
          quantity: 1,
        }),
      ],
    });

    expect(result.needCp).toBe(5010);
    expect(result.plans).toHaveLength(1);
    expect(result.plans[0]).toMatchObject({
      finalCp: 5880,
      gainedCp: 5080,
      overflowCp: 70,
      priceRmb: 317,
    });
    expect(formatPackageUses(result.plans[0]?.uses ?? [], "normal")).toBe(
      "5000 CP × 1，80 CP × 1",
    );
    expect(buildRechargePlanText(result.plans[0]!)).toContain("预计金额：317 元");
  });

  it("支持多个目标和数量合计后计算", () => {
    const result = calculateRechargePlans({
      availableDoublePackageIds: [],
      currentCp: 800,
      mode: "normal",
      targetItems: [
        targetItem({
          cp: 5810,
          id: "mythic-gun-guarantee",
          label: "神话枪皮保底",
          quantity: 2,
        }),
        targetItem({
          cp: 4950,
          id: "legend-draw",
          label: "传说转盘",
          quantity: 3,
        }),
      ],
    });

    const plan = result.plans[0]!;
    const text = buildRechargePlanText(plan);

    expect(result.needCp).toBe(25670);
    expect(plan).toMatchObject({
      gainedCp: 25760,
      overflowCp: 90,
      priceRmb: 1444,
      targetCp: 26470,
    });
    expect(formatPackageUses(plan.uses, "normal")).toBe(
      "10800 CP × 2，2400 CP × 1，880 CP × 2",
    );
    expect(text).toContain("神话枪皮保底：5810 CP × 2 = 11620 CP");
    expect(text).toContain("传说转盘：4950 CP × 3 = 14850 CP");
    expect(text).toContain("目标合计：26470 CP");
  });

  it("双倍模式只使用仍可用的双倍档位", () => {
    const result = calculateRechargePlans({
      availableDoublePackageIds: CODM_DOUBLE_PACKAGES.filter(
        (pack) => pack.id !== "double-400",
      ).map((pack) => pack.id),
      currentCp: 0,
      mode: "double",
      targetItems: [
        targetItem({
          cp: 800,
          id: "custom",
          label: "自定义目标",
          quantity: 1,
        }),
      ],
    });

    const plan = result.plans[0]!;

    expect(result.plans).toHaveLength(1);
    expect(formatPackageUses(plan.uses, "double")).toBe("80 + 80 × 1");
    expect(formatPackageUses(plan.uses, "double")).not.toContain("400 + 400");
    expect(plan.excludedDoubleLabels).toContain("400 + 400");
    expect(plan).toMatchObject({
      gainedCp: 820,
      overflowCp: 20,
      priceRmb: 60,
    });
  });

  it("双倍模式按金额优先，不为了使用双倍而过度充值", () => {
    const result = calculateRechargePlans({
      availableDoublePackageIds: CODM_DOUBLE_PACKAGES.map((pack) => pack.id),
      currentCp: 800,
      mode: "double",
      targetItems: [
        targetItem({
          cp: 5810,
          id: "mythic-gun-guarantee",
          label: "神话枪皮保底",
          quantity: 1,
        }),
      ],
    });

    const plan = result.plans[0]!;

    expect(result.plans).toHaveLength(1);
    expect(formatPackageUses(plan.uses, "double")).toBe(
      "2000 + 2000 × 1，400 + 400 × 1，80 + 80 × 1",
    );
    expect(formatPackageUses(plan.uses, "normal")).toBe("80 CP × 1");
    expect(plan).toMatchObject({
      gainedCp: 5040,
      overflowCp: 30,
      priceRmb: 206,
    });
  });
});
