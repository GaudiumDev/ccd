-- ============================================================
-- Migration 062: Año del último cambio de modo de participar
-- Complementa a `modo_participacion_ingreso` (056): aquel guarda
-- cómo entró la persona a la comunidad, éste guarda desde cuándo
-- rige el modo de participación vigente. Autodeclarado por el
-- cecista en Configuración → Perfil → Actividad; igual que 056,
-- NO reemplaza al historial institucional de `persona_modos`.
-- ============================================================

BEGIN;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS anio_ultimo_cambio_modo INTEGER;

COMMIT;
