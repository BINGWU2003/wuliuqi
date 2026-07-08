INSERT INTO "sequence_counters" ("counter_name", "current_value")
VALUES
  ('CODM_ACCOUNT', 0),
  ('SANGUOSHA_ACCOUNT', 0)
ON CONFLICT ("counter_name") DO NOTHING;
