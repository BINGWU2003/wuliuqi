import {
  ACCOUNT_SORT,
  ACCOUNT_SORT_VALUES,
  GAME_KEY,
  HOME_GAME_FILTER,
  HOME_GAME_FILTERS,
  SHOP_GAME_ATTRIBUTE_FILTERS,
} from "@wuliuqi/types";
import type {
  AccountSort,
  GameKey,
  HomeGameFilter,
  ShopAttributeFilterOption,
} from "@wuliuqi/types";

export interface ShopPriceRangeOption {
  label: string;
  max?: number;
  min?: number;
  value: string;
}

export const SHOP_PRICE_RANGES = [
  { label: "全部价格", value: "all" },
  { label: "¥0–500", min: 0, max: 500, value: "0-500" },
  { label: "¥501–1000", min: 501, max: 1000, value: "501-1000" },
  { label: "¥1001–2000", min: 1001, max: 2000, value: "1001-2000" },
  { label: "¥2001–5000", min: 2001, max: 5000, value: "2001-5000" },
  { label: "¥5000 以上", min: 5001, value: "5000+" },
] as const satisfies readonly ShopPriceRangeOption[];

export type ShopPriceRangeValue = (typeof SHOP_PRICE_RANGES)[number]["value"];
export type ShopAttributeSelections = Record<string, string>;

export interface HomeFilterState {
  gameKey: HomeGameFilter;
  priceRange: ShopPriceRangeValue;
  sort: AccountSort;
}

export interface AccountListFilterState {
  attributeSelections: ShopAttributeSelections;
  keyword: string;
  priceRange: ShopPriceRangeValue;
  sort: AccountSort;
}

type SearchParamValue = string | string[] | undefined;
export type ShopSearchParams = Record<string, SearchParamValue>;

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function validSort(value: string | undefined): AccountSort {
  return ACCOUNT_SORT_VALUES.some((sort) => sort === value)
    ? (value as AccountSort)
    : ACCOUNT_SORT.latest;
}

function validPriceRange(value: string | undefined): ShopPriceRangeValue {
  return SHOP_PRICE_RANGES.some((range) => range.value === value)
    ? (value as ShopPriceRangeValue)
    : "all";
}

export function parseHomeFilterState(
  searchParams: ShopSearchParams,
): HomeFilterState {
  const rawGameKey = firstParam(searchParams.game);
  const gameKey = HOME_GAME_FILTERS.some((value) => value === rawGameKey)
    ? (rawGameKey as HomeGameFilter)
    : HOME_GAME_FILTER.all;

  return {
    gameKey,
    priceRange: validPriceRange(firstParam(searchParams.price)),
    sort: validSort(firstParam(searchParams.sort)),
  };
}

export function parseAccountListFilterState(
  searchParams: ShopSearchParams,
  gameKey: GameKey,
): AccountListFilterState {
  const attributeSelections = Object.fromEntries(
    SHOP_GAME_ATTRIBUTE_FILTERS[gameKey].map((config) => {
      const rawValue = firstParam(searchParams[config.urlKey]);
      const value =
        rawValue && config.options.some((option) => option.value === rawValue)
          ? rawValue
          : "all";

      return [config.urlKey, value];
    }),
  );

  return {
    attributeSelections,
    keyword: firstParam(searchParams.q)?.trim() ?? "",
    priceRange: validPriceRange(firstParam(searchParams.price)),
    sort: validSort(firstParam(searchParams.sort)),
  };
}

export function priceRangeOption(
  value: ShopPriceRangeValue,
): ShopPriceRangeOption | undefined {
  return SHOP_PRICE_RANGES.find((range) => range.value === value);
}

export function attributeRangeOption(
  gameKey: GameKey,
  urlKey: string,
  value: string,
): ShopAttributeFilterOption | undefined {
  return SHOP_GAME_ATTRIBUTE_FILTERS[gameKey]
    .find((config) => config.urlKey === urlKey)
    ?.options.find((option) => option.value === value);
}

export function homeFilterSearchParams(state: HomeFilterState) {
  const params = new URLSearchParams();

  if (state.gameKey !== HOME_GAME_FILTER.all) {
    params.set("game", state.gameKey);
  }

  if (state.priceRange !== "all") {
    params.set("price", state.priceRange);
  }

  if (state.sort !== ACCOUNT_SORT.latest) {
    params.set("sort", state.sort);
  }

  return params;
}

export function accountListSearchParams(
  state: AccountListFilterState,
  gameKey: GameKey,
) {
  const params = new URLSearchParams();

  if (state.keyword) {
    params.set("q", state.keyword);
  }

  if (state.priceRange !== "all") {
    params.set("price", state.priceRange);
  }

  if (state.sort !== ACCOUNT_SORT.latest) {
    params.set("sort", state.sort);
  }

  for (const config of SHOP_GAME_ATTRIBUTE_FILTERS[gameKey]) {
    const value = state.attributeSelections[config.urlKey];

    if (value && value !== "all") {
      params.set(config.urlKey, value);
    }
  }

  return params;
}

export function gameListHref(gameKey: GameKey, state: HomeFilterState) {
  const pathname =
    gameKey === GAME_KEY.sanguosha
      ? "/sanguosha-account-page"
      : "/codm-account-page";
  const params = accountListSearchParams(
    {
      attributeSelections: {},
      keyword: "",
      priceRange: state.priceRange,
      sort: state.sort,
    },
    gameKey,
  );
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
