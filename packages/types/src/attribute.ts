export const GAME_ATTRIBUTE_TYPES = ["number", "select"] as const;
export type GameAttributeType = (typeof GAME_ATTRIBUTE_TYPES)[number];

export type AccountAttributePrimitive = number | string;

export type AccountAttributes = Record<string, AccountAttributePrimitive>;

export interface GameAttributeOption {
  label: string;
  value: string;
}

export interface GameAttributeDefinition {
  id: number;
  gameKey: string;
  attrKey: string;
  label: string;
  type: GameAttributeType;
  unit?: string;
  options: GameAttributeOption[];
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  usageCount?: number;
}

export interface AccountAttributeValue {
  key: string;
  label: string;
  type: GameAttributeType;
  enabled: boolean;
  value: AccountAttributePrimitive;
  displayValue: string;
  unit?: string;
  sortOrder: number;
}
