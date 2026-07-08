CREATE TABLE "sanguosha_accounts" (
  "id" BIGSERIAL NOT NULL,
  "serial_number" VARCHAR(50) NOT NULL,
  "images" JSONB,
  "attributes" JSONB NOT NULL DEFAULT '{}',
  "price" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "title" VARCHAR(255) NOT NULL,
  "describe" TEXT,
  "xianyu_url" VARCHAR(512),
  "email" VARCHAR(255),
  "status" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sanguosha_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sanguosha_accounts_serial_number_key"
  ON "sanguosha_accounts"("serial_number");

CREATE INDEX "sanguosha_accounts_status_updated_at_idx"
  ON "sanguosha_accounts"("status", "updated_at" DESC);

CREATE INDEX "sanguosha_accounts_created_at_idx"
  ON "sanguosha_accounts"("created_at" DESC);

CREATE INDEX "sanguosha_accounts_email_idx"
  ON "sanguosha_accounts"("email");

CREATE TABLE "sanguosha_emails" (
  "id" BIGSERIAL NOT NULL,
  "prefix" VARCHAR(64) NOT NULL,
  "postfix" VARCHAR(255) NOT NULL,
  "bind_status" SMALLINT NOT NULL DEFAULT 2,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sanguosha_emails_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sanguosha_emails_address_idx"
  ON "sanguosha_emails"("prefix", "postfix");
