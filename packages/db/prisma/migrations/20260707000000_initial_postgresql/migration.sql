CREATE OR REPLACE FUNCTION set_business_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "codm_accounts" (
  "id" BIGSERIAL PRIMARY KEY,
  "serial_number" VARCHAR(50) NOT NULL UNIQUE,
  "images" JSONB,
  "price" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "title" VARCHAR(255) NOT NULL,
  "describe" TEXT,
  "xianyu_url" VARCHAR(512),
  "email" VARCHAR(255),
  "status" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "codm_accounts_status_nonnegative_check" CHECK ("status" >= 0),
  CONSTRAINT "codm_accounts_price_nonnegative_check" CHECK ("price" >= 0)
);

CREATE TABLE "codm_emails" (
  "id" BIGSERIAL PRIMARY KEY,
  "prefix" VARCHAR(64) NOT NULL,
  "postfix" VARCHAR(255) NOT NULL,
  "bind_status" SMALLINT NOT NULL DEFAULT 2,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "codm_emails_bind_status_nonnegative_check" CHECK ("bind_status" >= 0)
);

CREATE TABLE "carousels" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "items" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "sequence_counters" (
  "id" BIGSERIAL PRIMARY KEY,
  "counter_name" VARCHAR(50) NOT NULL UNIQUE,
  "current_value" BIGINT NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sequence_counters_current_value_nonnegative_check" CHECK ("current_value" >= 0)
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(100) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "codm_accounts_status_updated_at_idx"
  ON "codm_accounts" ("status", "updated_at" DESC);

CREATE INDEX "codm_accounts_email_idx"
  ON "codm_accounts" ("email");

CREATE INDEX "codm_emails_address_idx"
  ON "codm_emails" ("prefix", "postfix");

DROP TRIGGER IF EXISTS "codm_accounts_set_updated_at" ON "codm_accounts";
CREATE TRIGGER "codm_accounts_set_updated_at"
  BEFORE UPDATE ON "codm_accounts"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();

DROP TRIGGER IF EXISTS "codm_emails_set_updated_at" ON "codm_emails";
CREATE TRIGGER "codm_emails_set_updated_at"
  BEFORE UPDATE ON "codm_emails"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();

DROP TRIGGER IF EXISTS "carousels_set_updated_at" ON "carousels";
CREATE TRIGGER "carousels_set_updated_at"
  BEFORE UPDATE ON "carousels"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();

DROP TRIGGER IF EXISTS "sequence_counters_set_updated_at" ON "sequence_counters";
CREATE TRIGGER "sequence_counters_set_updated_at"
  BEFORE UPDATE ON "sequence_counters"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();

DROP TRIGGER IF EXISTS "users_set_updated_at" ON "users";
CREATE TRIGGER "users_set_updated_at"
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION set_business_updated_at();
