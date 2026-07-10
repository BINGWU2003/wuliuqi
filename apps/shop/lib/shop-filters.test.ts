import { describe, expect, it } from "vitest";
import { ACCOUNT_SORT, GAME_KEY, HOME_GAME_FILTER } from "@wuliuqi/types";
import {
  accountListSearchParams,
  gameListHref,
  parseAccountListFilterState,
  parseHomeFilterState,
} from "./shop-filters";

describe("商城筛选 URL", () => {
  it("解析首页通用筛选并忽略无效参数", () => {
    expect(
      parseHomeFilterState({
        game: "codm",
        price: "1001-2000",
        sort: "invalid",
      }),
    ).toEqual({
      gameKey: HOME_GAME_FILTER.codm,
      priceRange: "1001-2000",
      sort: ACCOUNT_SORT.latest,
    });
  });

  it("只解析当前游戏公开允许的专属筛选", () => {
    expect(
      parseAccountListFilterState(
        {
          legendary: "30-49",
          mythic: "10-19",
          rank: "legendary_war_god",
        },
        GAME_KEY.codm,
      ),
    ).toMatchObject({
      attributeSelections: {
        legendary: "30-49",
        mythic: "10-19",
      },
    });

    expect(
      parseAccountListFilterState(
        { legendary: "30-49", mythic: "10-19" },
        GAME_KEY.sanguosha,
      ).attributeSelections,
    ).toEqual({});
  });

  it("首页进入专区时保留价格和排序条件", () => {
    expect(
      gameListHref(GAME_KEY.codm, {
        gameKey: HOME_GAME_FILTER.all,
        priceRange: "2001-5000",
        sort: ACCOUNT_SORT.priceAsc,
      }),
    ).toBe("/codm-account-page?price=2001-5000&sort=price_asc");
  });

  it("只序列化非默认列表筛选", () => {
    expect(
      accountListSearchParams(
        {
          attributeSelections: {
            legendary: "all",
            mythic: "20+",
          },
          keyword: "CODM-21",
          priceRange: "all",
          sort: ACCOUNT_SORT.latest,
        },
        GAME_KEY.codm,
      ).toString(),
    ).toBe("q=CODM-21&mythic=20%2B");
  });
});
