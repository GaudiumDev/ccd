-- Migration 009: Migrar eventos.casa_retiro_id para referenciar casas_retiro en lugar de organizaciones

BEGIN;

-- Eliminar FK viejo hacia organizaciones
ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_casa_retiro_id_fkey;

-- Agregar nuevo FK hacia casas_retiro
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_casa_retiro_id_fkey
    FOREIGN KEY (casa_retiro_id)
    REFERENCES public.casas_retiro(id)
    ON DELETE SET NULL;

COMMIT;
