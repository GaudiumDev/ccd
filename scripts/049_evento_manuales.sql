-- Migration 049: Manuales para Pendiente Datos Noticias
-- Se completa junto con los centralizadores, antes de solicitar la
-- publicación final del evento.

BEGIN;

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS manuales_stock       INTEGER,
  ADD COLUMN IF NOT EXISTS manuales_necesarios  INTEGER,
  ADD COLUMN IF NOT EXISTS manuales_solicitados INTEGER
    GENERATED ALWAYS AS (
      GREATEST(COALESCE(manuales_necesarios, 0) - COALESCE(manuales_stock, 0), 0)
    ) STORED;

COMMIT;
