ALTER TABLE "game_attribute_definitions"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "game_attribute_definitions_game_deleted_enabled_sort_idx"
  ON "game_attribute_definitions" ("game_key", "deleted_at", "enabled", "sort_order");
