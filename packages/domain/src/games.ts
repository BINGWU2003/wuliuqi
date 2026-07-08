import type { GameKey, GameOption } from "@wuliuqi/types";

type Delegate = {
  aggregate(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
  groupBy(args: unknown): Promise<unknown[]>;
  update(args: unknown): Promise<unknown>;
  updateMany(args: unknown): Promise<unknown>;
};

type GameClient = {
  codmAccount: Delegate;
  codmEmail: Delegate;
  sanguoshaAccount: Delegate;
  sanguoshaEmail: Delegate;
};

type GameConfig = GameOption & {
  accountCounterName: string;
  serialPrefix: string;
};

export const DEFAULT_GAME_KEY: GameKey = "codm";

export const GAME_CONFIGS: Record<GameKey, GameConfig> = {
  codm: {
    key: "codm",
    label: "CODM",
    shortLabel: "CODM",
    accountListPath: "/codm-account-page",
    accountCounterName: "CODM_ACCOUNT",
    serialPrefix: "#CODM-",
  },
  sanguosha: {
    key: "sanguosha",
    label: "三国杀",
    shortLabel: "三国杀",
    accountListPath: "/sanguosha-account-page",
    accountCounterName: "SANGUOSHA_ACCOUNT",
    serialPrefix: "#SGS-",
  },
};

export const GAME_OPTIONS = Object.values(GAME_CONFIGS);

export function normalizeGameKey(gameKey?: string | null): GameKey {
  return gameKey === "sanguosha" ? "sanguosha" : DEFAULT_GAME_KEY;
}

export function gameConfig(gameKey?: string | null): GameConfig {
  return GAME_CONFIGS[normalizeGameKey(gameKey)];
}

export function accountDelegate(client: unknown, gameKey?: string | null) {
  const gameClient = client as GameClient;

  return normalizeGameKey(gameKey) === "sanguosha"
    ? gameClient.sanguoshaAccount
    : gameClient.codmAccount;
}

export function emailDelegate(client: unknown, gameKey?: string | null) {
  const gameClient = client as GameClient;

  return normalizeGameKey(gameKey) === "sanguosha"
    ? gameClient.sanguoshaEmail
    : gameClient.codmEmail;
}
