export const GAME_KEY = {
  codm: "codm",
  sanguosha: "sanguosha",
} as const;

export const GAME_KEYS = [GAME_KEY.codm, GAME_KEY.sanguosha] as const;
export type GameKey = (typeof GAME_KEYS)[number];

export const DEFAULT_GAME_KEY: GameKey = GAME_KEY.codm;

export const HOME_GAME_FILTER = {
  ...GAME_KEY,
  all: "all",
} as const;

export const HOME_GAME_FILTERS = [
  HOME_GAME_FILTER.codm,
  HOME_GAME_FILTER.sanguosha,
  HOME_GAME_FILTER.all,
] as const;
export type HomeGameFilter = (typeof HOME_GAME_FILTERS)[number];

export interface GameOption {
  key: GameKey;
  label: string;
  shortLabel: string;
  accountListPath: string;
}
