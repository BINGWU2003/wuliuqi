ALTER TABLE "codm_accounts"
  ADD COLUMN "cost_price" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "sold_price" DECIMAL(10, 2),
  ADD COLUMN "sold_at" TIMESTAMP(3);

ALTER TABLE "sanguosha_accounts"
  ADD COLUMN "cost_price" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "sold_price" DECIMAL(10, 2),
  ADD COLUMN "sold_at" TIMESTAMP(3);
