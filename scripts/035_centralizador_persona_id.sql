-- Migration 035: Add persona_id FK references for centralizadores on eventos
-- Allows linking centralizador contact entries back to their person profiles.

BEGIN;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS centralizador_1_persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS centralizador_2_persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS centralizador_3_persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL;

COMMIT;
