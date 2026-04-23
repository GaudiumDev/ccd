-- Migration 022: Agregar coordenadas GPS y campos de accesibilidad a casas_retiro

BEGIN;

ALTER TABLE public.casas_retiro
  ADD COLUMN IF NOT EXISTS latitud         NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitud        NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS tiene_escaleras BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tiene_ascensor  BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.casas_retiro.latitud         IS 'Latitud GPS (WGS84)';
COMMENT ON COLUMN public.casas_retiro.longitud        IS 'Longitud GPS (WGS84)';
COMMENT ON COLUMN public.casas_retiro.tiene_escaleras IS 'Indica si la casa cuenta con escaleras';
COMMENT ON COLUMN public.casas_retiro.tiene_ascensor  IS 'Indica si la casa cuenta con ascensor';

COMMIT;
