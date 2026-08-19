-- ============================================================
-- Migration 058: Forzar cambio de contraseña temporal (cecistas)
-- Los logins creados por scripts/create_cecista_logins.mjs usan
-- password = nombre de usuario (TEMPORAL). Esta columna marca a
-- quién falta pedirle que la cambie antes de usar la plataforma
-- (ver lib/supabase/proxy.ts).
-- ============================================================

-- Rollout en 2 pasos (ver scripts/059_debe_cambiar_password_backfill.sql
-- para el backfill masivo, que se corre aparte una vez probado el flujo).

BEGIN;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
