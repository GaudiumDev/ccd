-- Migration 011: Add nombre_usuario to personas for username-based auth
-- Strategy: Supabase Auth requires email; we use {username}@ccd.internal as the internal email.
-- Users only ever see/type their username — the fake email is never exposed.

BEGIN;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS nombre_usuario TEXT;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_nombre_usuario_unique UNIQUE (nombre_usuario);

CREATE INDEX IF NOT EXISTS idx_personas_nombre_usuario
  ON public.personas (nombre_usuario)
  WHERE nombre_usuario IS NOT NULL;

COMMIT;
