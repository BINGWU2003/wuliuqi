WITH ranked_postfixes AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "postfix"
      ORDER BY "enabled" DESC, "sort_order" ASC, "id" ASC
    ) AS "rank",
    bool_or("enabled") OVER (PARTITION BY "postfix") AS "merged_enabled",
    min("sort_order") OVER (PARTITION BY "postfix") AS "merged_sort_order"
  FROM "game_email_postfixes"
)
UPDATE "game_email_postfixes" AS "target"
SET
  "game_key" = 'global',
  "enabled" = "ranked_postfixes"."merged_enabled",
  "sort_order" = "ranked_postfixes"."merged_sort_order"
FROM "ranked_postfixes"
WHERE "target"."id" = "ranked_postfixes"."id"
  AND "ranked_postfixes"."rank" = 1;

DELETE FROM "game_email_postfixes"
USING (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "postfix"
      ORDER BY "enabled" DESC, "sort_order" ASC, "id" ASC
    ) AS "rank"
  FROM "game_email_postfixes"
) AS "ranked_postfixes"
WHERE "game_email_postfixes"."id" = "ranked_postfixes"."id"
  AND "ranked_postfixes"."rank" > 1;

ALTER TABLE "game_email_postfixes"
  ALTER COLUMN "game_key" SET DEFAULT 'global';

DROP INDEX IF EXISTS "game_email_postfixes_game_postfix_key";
DROP INDEX IF EXISTS "game_email_postfixes_game_enabled_sort_idx";

CREATE UNIQUE INDEX "game_email_postfixes_postfix_key"
  ON "game_email_postfixes"("postfix");

CREATE INDEX "game_email_postfixes_enabled_sort_idx"
  ON "game_email_postfixes"("enabled", "sort_order");
