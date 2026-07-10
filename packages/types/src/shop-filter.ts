import { GAME_KEY } from "./game";
import type { GameKey } from "./game";

export type ShopAttributeFilterQueryKey =
  "legendary_max" | "legendary_min" | "mythic_max" | "mythic_min";

export interface ShopAttributeFilterOption {
  label: string;
  max?: number;
  min?: number;
  value: string;
}

export interface ShopAttributeFilterConfig {
  attributeKey: string;
  label: string;
  maxQueryKey: ShopAttributeFilterQueryKey;
  minQueryKey: ShopAttributeFilterQueryKey;
  options: readonly ShopAttributeFilterOption[];
  urlKey: string;
}

/**
 * Public shop filter allowlist.
 *
 * Only attributes that exist in production, materially help buying decisions,
 * and have sufficient listed-account coverage belong here. Keep low-coverage
 * attributes visible on cards/details instead of exposing misleading filters.
 */
export const SHOP_GAME_ATTRIBUTE_FILTERS = {
  [GAME_KEY.codm]: [
    {
      attributeKey: "mythic_skins",
      label: "神话皮肤",
      minQueryKey: "mythic_min",
      maxQueryKey: "mythic_max",
      urlKey: "mythic",
      options: [
        { label: "全部神话数量", value: "all" },
        { label: "1–4 个神话", min: 1, max: 4, value: "1-4" },
        { label: "5–9 个神话", min: 5, max: 9, value: "5-9" },
        { label: "10–19 个神话", min: 10, max: 19, value: "10-19" },
        { label: "20 个以上神话", min: 20, value: "20+" },
      ],
    },
    {
      attributeKey: "legendary_skins",
      label: "传说皮肤",
      minQueryKey: "legendary_min",
      maxQueryKey: "legendary_max",
      urlKey: "legendary",
      options: [
        { label: "全部传说数量", value: "all" },
        { label: "1–9 个传说", min: 1, max: 9, value: "1-9" },
        { label: "10–29 个传说", min: 10, max: 29, value: "10-29" },
        { label: "30–49 个传说", min: 30, max: 49, value: "30-49" },
        { label: "50 个以上传说", min: 50, value: "50+" },
      ],
    },
  ],
  // Only two Sanguosha accounts are currently listed. Keep its existing
  // attributes on cards/details until the inventory is large enough for a
  // filter to narrow results meaningfully.
  [GAME_KEY.sanguosha]: [],
} as const satisfies Record<GameKey, readonly ShopAttributeFilterConfig[]>;
