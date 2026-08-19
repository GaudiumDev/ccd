-- ============================================================
-- Migration 059: Backfill debe_cambiar_password (paso 2)
-- Correr SOLO después de confirmar que el flujo funciona bien
-- probado con una cuenta de test (ver scripts/058_...sql).
-- Marca a los ~1900 cecistas que ya tienen login creado.
-- ============================================================

BEGIN;

UPDATE public.personas
SET debe_cambiar_password = TRUE
WHERE tipo_persona = 'cecista'
  AND auth_user_id IS NOT NULL;

COMMIT;
