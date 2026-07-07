ALTER TABLE IF EXISTS "public"."codm_accounts"
  ADD COLUMN IF NOT EXISTS "attributes" JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS "public"."game_attribute_definitions" (
  "id" BIGSERIAL PRIMARY KEY,
  "game_key" VARCHAR(50) NOT NULL,
  "attr_key" VARCHAR(80) NOT NULL,
  "label" VARCHAR(80) NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "unit" VARCHAR(20),
  "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "game_attribute_definitions_type_check" CHECK ("type" IN ('number', 'select')),
  CONSTRAINT "game_attribute_definitions_options_array_check" CHECK (jsonb_typeof("options") = 'array'),
  CONSTRAINT "game_attribute_definitions_game_attr_key" UNIQUE ("game_key", "attr_key")
);

CREATE INDEX IF NOT EXISTS "game_attribute_definitions_game_enabled_sort_idx"
  ON "public"."game_attribute_definitions" ("game_key", "enabled", "sort_order");

DROP TRIGGER IF EXISTS "game_attribute_definitions_set_updated_at"
  ON "public"."game_attribute_definitions";
CREATE TRIGGER "game_attribute_definitions_set_updated_at"
  BEFORE UPDATE ON "public"."game_attribute_definitions"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();

INSERT INTO "public"."game_attribute_definitions" (
  "game_key",
  "attr_key",
  "label",
  "type",
  "unit",
  "options",
  "enabled",
  "sort_order"
)
VALUES
  ('codm', 'legendary_skins', '传说皮肤', 'number', '个', '[]'::jsonb, true, 10),
  ('codm', 'mythic_skins', '神话皮肤', 'number', '个', '[]'::jsonb, true, 20),
  (
    'codm',
    'rank',
    '段位',
    'select',
    NULL,
    '[{"label":"青铜","value":"bronze"},{"label":"钻石","value":"diamond"},{"label":"传奇战神","value":"legendary_war_god"}]'::jsonb,
    true,
    30
  )
ON CONFLICT ("game_key", "attr_key") DO UPDATE
SET "label" = EXCLUDED."label",
    "type" = EXCLUDED."type",
    "unit" = EXCLUDED."unit",
    "options" = EXCLUDED."options",
    "enabled" = EXCLUDED."enabled",
    "sort_order" = EXCLUDED."sort_order";

ALTER TABLE IF EXISTS "public"."game_attribute_definitions" ENABLE ROW LEVEL SECURITY;
