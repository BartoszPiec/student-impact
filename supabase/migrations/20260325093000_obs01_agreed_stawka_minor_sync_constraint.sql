-- OBS-01: Enforce DB-level consistency between agreed_stawka and agreed_stawka_minor.
-- Prevents silent drift via REST API direct updates that skip application-layer dual-write.
-- Safe: allows NULL in either column (negotiation not yet complete), only enforces sync when both are set.
ALTER TABLE applications
  ADD CONSTRAINT agreed_stawka_minor_sync_check
  CHECK (
    agreed_stawka IS NULL
    OR agreed_stawka_minor IS NULL
    OR agreed_stawka_minor = ROUND(agreed_stawka * 100)::bigint
  );
