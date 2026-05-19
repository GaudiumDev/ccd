-- Migration 028: Centralizadores y campo notas para Pendiente Datos Noticias
-- El solicitante completa estos datos antes de que el evento quede aprobado
-- para publicación.

BEGIN;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS centralizador_1_nombre   TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_1_email    TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_1_telefono TEXT,

  ADD COLUMN IF NOT EXISTS centralizador_2_nombre   TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_2_email    TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_2_telefono TEXT,

  ADD COLUMN IF NOT EXISTS centralizador_3_nombre   TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_3_email    TEXT,
  ADD COLUMN IF NOT EXISTS centralizador_3_telefono TEXT,

  -- notas_noticias es separado de notas (notas del evento) y de notas_discernimiento
  ADD COLUMN IF NOT EXISTS notas_noticias           TEXT;

COMMIT;
