export type CodmSkinAttributes = {
  mythic_skins?: number;
  legendary_skins?: number;
};

export function parseCodmSkinAttributes(
  title?: string | null,
  description?: string | null,
): CodmSkinAttributes {
  const source = `${title ?? ""} ${description ?? ""}`;
  const mythic = source.match(/(\d+)\s*神(?:话)?/);
  const legendary = source.match(/(\d+)\s*传(?:说)?/);
  const attributes: CodmSkinAttributes = {};

  if (mythic?.[1]) {
    attributes.mythic_skins = Number(mythic[1]);
  }

  if (legendary?.[1]) {
    attributes.legendary_skins = Number(legendary[1]);
  }

  return attributes;
}
