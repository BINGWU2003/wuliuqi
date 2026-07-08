CREATE TABLE "game_email_postfixes" (
  "id" BIGSERIAL NOT NULL,
  "game_key" VARCHAR(50) NOT NULL,
  "postfix" VARCHAR(255) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "game_email_postfixes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_email_postfixes_game_postfix_key"
  ON "game_email_postfixes"("game_key", "postfix");

CREATE INDEX "game_email_postfixes_game_enabled_sort_idx"
  ON "game_email_postfixes"("game_key", "enabled", "sort_order");

INSERT INTO "game_email_postfixes" ("game_key", "postfix", "enabled", "sort_order")
VALUES
  ('codm', '@163.com', true, 0),
  ('codm', '@gmail.com', true, 1),
  ('codm', '@outlook.com', true, 2),
  ('codm', '@hotmail.com', true, 3),
  ('codm', '@yahoo.com', true, 4),
  ('codm', '@qq.com', true, 5),
  ('codm', '@126.com', true, 6),
  ('sanguosha', '@163.com', true, 0)
ON CONFLICT ("game_key", "postfix") DO NOTHING;

INSERT INTO "game_email_postfixes" ("game_key", "postfix", "enabled", "sort_order")
SELECT 'codm', "postfix", true, 1000
FROM "codm_emails"
GROUP BY "postfix"
ON CONFLICT ("game_key", "postfix") DO NOTHING;

INSERT INTO "game_email_postfixes" ("game_key", "postfix", "enabled", "sort_order")
SELECT 'sanguosha', "postfix", true, 1000
FROM "sanguosha_emails"
GROUP BY "postfix"
ON CONFLICT ("game_key", "postfix") DO NOTHING;
