-- ============================================================
-- Migration 056: Modo de participación al ingreso
-- Campo autodeclarado por el cecista al completar su perfil en
-- Configuración — es una "foto" de cómo entró a la comunidad,
-- deliberadamente NO ligada al historial de persona_modos (que
-- sigue gestionando la Administración de CcD vía la ficha de
-- persona). Evita mezclar el modo institucional vigente con este
-- dato de onboarding.
-- ============================================================

BEGIN;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS modo_participacion_ingreso TEXT;

COMMIT;
