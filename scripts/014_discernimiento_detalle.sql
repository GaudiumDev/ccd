-- Migration 014: Columnas de discernimiento por nivel
-- Guarda el resultado detallado de cada nivel de aprobación por separado.

BEGIN;

ALTER TABLE public.eventos
  -- Discernimiento Confraternidad / Delegado
  ADD COLUMN IF NOT EXISTS disc_confra_estado TEXT
    CHECK (disc_confra_estado IN (
      'aprobado_sin_modificaciones',
      'aprobado_con_modificaciones',
      'rechazado'
    )),
  ADD COLUMN IF NOT EXISTS disc_confra_fecha   DATE,
  ADD COLUMN IF NOT EXISTS disc_confra_notas   TEXT,
  ADD COLUMN IF NOT EXISTS disc_confra_por     UUID REFERENCES public.personas(id),

  -- Discernimiento Equipo Timón
  ADD COLUMN IF NOT EXISTS disc_eqt_estado TEXT
    CHECK (disc_eqt_estado IN (
      'aprobado_sin_modificaciones',
      'aprobado_con_modificaciones',
      'rechazado'
    )),
  ADD COLUMN IF NOT EXISTS disc_eqt_fecha   DATE,
  ADD COLUMN IF NOT EXISTS disc_eqt_notas   TEXT,
  ADD COLUMN IF NOT EXISTS disc_eqt_por     UUID REFERENCES public.personas(id);

COMMIT;
